/**
 * RAG orchestrator — the full retrieval-augmented generation pipeline.
 *
 *   question → embed → Postgres vector search (cosine top-K)
 *     → confidence gate ("do we actually know this?")
 *     → grounded generation (OpenAI if OPENAI_API_KEY is set,
 *       otherwise the built-in extractive synthesizer)
 *     → answer + cited sources
 */

import { embed } from "./embed";
import {
  rankChunks,
  searchChunks,
  type RetrievedChunk,
} from "./vector";
import { getIdfLookup } from "./kb";
import {
  ANSWER_THRESHOLD,
  CONTEXT_MIN,
  UNKNOWN_OVERLAP_GATE,
  buildSources,
  buildUnknownAnswer,
  synthesizeAnswer,
} from "./synthesize";
import { db } from "@/db";
import { Doc } from "@/db/schema";

export interface RagHistoryTurn {
  role: "user" | "assistant";
  content: string;
}

export interface RagResult {
  answer: string;
  sources: ReturnType<typeof buildSources>;
  topScore: number;
  unknown: boolean;
}

async function knowledgeTitles(): Promise<string[]> {
  await db();
  const rows = await Doc.find({ status: "ready" }).select("title");
  return rows.map((r) => r.title);
}

export async function answerQuestion(
  question: string,
  history: RagHistoryTurn[] = [],
  options?: { category?: string }
): Promise<RagResult> {
  const idf = await getIdfLookup();
  
  // 1. Auto-detect language and translate to English
  const { language, englishQuery } = await detectAndTranslateQuery(question);
  
  // Query Expansion: Prepend the category to force the vector search to rank these chunks higher
  const searchQuestion = options?.category ? `${options.category} ${englishQuery}` : englishQuery;
  const queryEmbedding = embed(searchQuestion, idf);

  // 1. Vector search → 2. hybrid re-rank (cosine + IDF term-overlap).
  // We pass searchQuestion to rankChunks so IDF term-overlap also considers the category terms.
  const retrieved = await searchChunks(queryEmbedding, 16, options?.category);
  const ranked = rankChunks(searchQuestion, retrieved, idf);
  const top = ranked[0];

  // 3. Unknown-question gate
  if (!top || top.final < ANSWER_THRESHOLD || top.overlap < UNKNOWN_OVERLAP_GATE) {
    let unknownAns = buildUnknownAnswer(question, await knowledgeTitles());
    if (language && language.toLowerCase() !== "english") {
      unknownAns = await translateText(unknownAns, language);
    }
    return {
      answer: unknownAns,
      sources: [],
      topScore: top?.final ?? 0,
      unknown: true,
    };
  }

  // 4. Grounded generation over the surviving context.
  const context = ranked
    .filter((c) => c.final >= CONTEXT_MIN && c.overlap > 0)
    .slice(0, 8);

  const answer = await generateAnswerFallback(question, context, history, language);

  return {
    answer,
    sources: buildSources(context, question),
    topScore: top.final,
    unknown: false,
  };
}

/** Multi-LLM Orchestrator with Fallback */
async function generateAnswerFallback(
  question: string,
  context: RetrievedChunk[],
  history: RagHistoryTurn[],
  language?: string,
): Promise<string> {
  const contextBlock = context
    .map((c, i) => `[Source ${i + 1}] ${c.title} (${c.category})\n${c.content}`)
    .join("\n\n");

  const providers = [];
  if (process.env.GEMINI_API_KEY) {
    providers.push({
      name: "Gemini",
      fn: () => askGemini(question, contextBlock, history, language),
    });
  }
  if (process.env.OPENAI_API_KEY) {
    providers.push({
      name: "OpenAI",
      fn: () =>
        askOpenAiLike(
          question,
          contextBlock,
          history,
          "https://api.openai.com/v1/chat/completions",
          process.env.OPENAI_API_KEY!,
          process.env.OPENAI_MODEL ?? "gpt-4o-mini",
          language,
        ),
    });
  }
  if (process.env.OPENROUTER_API_KEY) {
    providers.push({
      name: "OpenRouter",
      fn: () =>
        askOpenAiLike(
          question,
          contextBlock,
          history,
          "https://openrouter.ai/api/v1/chat/completions",
          process.env.OPENROUTER_API_KEY!,
          process.env.OPENROUTER_MODEL ?? "google/gemini-flash-1.5",
          language,
        ),
    });
  }

  for (const provider of providers) {
    try {
      console.log(`[LLM] Attempting with ${provider.name}...`);
      return await provider.fn();
    } catch (err) {
      console.warn(`[LLM] ${provider.name} failed, falling back.`);
    }
  }

  console.log(`[LLM] All providers failed. Falling back to simple synthesis.`);
  return synthesizeAnswer(question, context);
}

async function askGemini(
  question: string,
  contextBlock: string,
  history: RagHistoryTurn[],
  language: string = "English",
): Promise<string> {
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const system = `You are a professional, highly organized AI assistant.\nYour goal is to summarize and explain the information provided in the CONTEXT below in a very clear, structured, and professional manner.\nCRITICAL FORMATTING RULES:\n- Use Markdown bullet points (-) whenever listing multiple items, features, or steps.\n- Use **bold text** to highlight key terms, headings, or important concepts.\n- Keep it highly readable and visually broken up.\n- **YOU MUST ANSWER THE USER IN THE ${language.toUpperCase()} LANGUAGE, REGARDLESS OF THE LANGUAGE OF THE CONTEXT!**\nAnswer ONLY using the CONTEXT below, which is automatically retrieved from the uploaded documents.\nIf the context does not contain the answer, politely state that the information is not available in the database — never invent facts, numbers, or dates.\nDO NOT include any inline citations or source references in your text.\n\nCONTEXT:\n${contextBlock}`;

  const contents = [
    { role: "user", parts: [{ text: system }] },
    { role: "model", parts: [{ text: "Understood." }] },
  ];
  for (const h of history.slice(-6)) {
    contents.push({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    });
  }
  contents.push({ role: "user", parts: [{ text: question }] });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents }),
  });
  if (!res.ok) throw new Error(`Gemini error ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error("Empty Gemini response");
  return text;
}

async function askOpenAiLike(
  question: string,
  contextBlock: string,
  history: RagHistoryTurn[],
  url: string,
  key: string,
  model: string,
  language: string = "English",
): Promise<string> {
  const system = `You are a professional, highly organized AI assistant.\nYour goal is to summarize and explain the information provided in the CONTEXT below in a very clear, structured, and professional manner.\nCRITICAL FORMATTING RULES:\n- Use Markdown bullet points (-) whenever listing multiple items, features, or steps.\n- Use **bold text** to highlight key terms, headings, or important concepts.\n- Keep it highly readable and visually broken up.\n- **YOU MUST ANSWER THE USER IN THE ${language.toUpperCase()} LANGUAGE, REGARDLESS OF THE LANGUAGE OF THE CONTEXT!**\nAnswer ONLY using the CONTEXT below, which is automatically retrieved from the uploaded documents.\nIf the context does not contain the answer, politely state that the information is not available in the database — never invent facts, numbers, or dates.\nDO NOT include any inline citations or source references in your text.\n\nCONTEXT:\n${contextBlock}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        ...history.slice(-6),
        { role: "user", content: question },
      ],
    }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty response");
  return content;
}

export async function generateDocumentSummary(text: string): Promise<string | undefined> {
  const prompt = "Please generate a very concise, 1-2 sentence summary of the following document text. Do not include any formatting, bullet points, or introductory phrases like 'This document is about'. Just output the summary directly.\n\n" + text.slice(0, 3000);

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (openRouterKey) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openRouterKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL ?? "google/gemini-2.0-flash-exp:free",
          temperature: 0.2,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) return content;
      }
    } catch (err) {
      console.warn("[Summarizer] OpenRouter failed, falling back to Gemini.", err);
    }
  }

  if (geminiKey) {
    try {
      const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return text;
      }
    } catch (err) {
      console.warn("[Summarizer] Gemini failed.", err);
    }
  }

  return undefined;
}

export async function detectAndTranslateQuery(query: string): Promise<{ language: string; englishQuery: string }> {
  const prompt = `You are a translator. Analyze the following text.
If it is already in English, return exactly: {"language": "English", "englishQuery": "[the exact query]"}.
If it is in another language (e.g. Hindi, Tamil, Telugu, etc.), translate it to English and return exactly: {"language": "[Detected Language Name]", "englishQuery": "[English Translation]"}.
IMPORTANT: You MUST use formal, literal academic terminology in the English translation to maximize search accuracy. For example, strictly use "admission fee" instead of "joining fee", and "refund" instead of "get back". Keep the translation strictly literal.
Respond ONLY with valid JSON. Do not include markdown code blocks or any other text.
Text to translate:
"${query.replace(/"/g, '\\"')}"`;

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (openRouterKey) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openRouterKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL ?? "google/gemini-2.0-flash-exp:free",
          temperature: 0.1,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) {
          try {
            const parsed = JSON.parse(content.replace(/```json/g, "").replace(/```/g, "").trim());
            return { language: parsed.language || "English", englishQuery: parsed.englishQuery || query };
          } catch (e) {
            console.error("Failed to parse translation JSON:", content);
          }
        }
      }
    } catch (err) {
      console.warn("[Translator] OpenRouter failed, falling back to Gemini.", err);
    }
  }

  if (geminiKey) {
    try {
      const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (content) {
          try {
            const parsed = JSON.parse(content.replace(/```json/g, "").replace(/```/g, "").trim());
            return { language: parsed.language || "English", englishQuery: parsed.englishQuery || query };
          } catch (e) {
            console.error("Failed to parse translation JSON from Gemini:", content);
          }
        }
      }
    } catch (err) {
      console.warn("[Translator] Gemini failed.", err);
    }
  }

  return { language: "English", englishQuery: query };
}

async function translateText(text: string, targetLanguage: string): Promise<string> {
  const prompt = `Translate the following text into ${targetLanguage}. Preserve the tone, formatting, and any bullet points exactly. Do not output anything other than the translation.\n\n${text}`;
  
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (openRouterKey) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openRouterKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL ?? "google/gemini-2.0-flash-exp:free",
          temperature: 0.1,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) return content;
      }
    } catch (err) {}
  }

  if (geminiKey) {
    try {
      const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (content) return content;
      }
    } catch (err) {}
  }
  
  return text; // fallback to English
}
