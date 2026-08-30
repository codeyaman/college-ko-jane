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
  const queryEmbedding = embed(question, idf);

  // 1. Vector search → 2. hybrid re-rank (cosine + IDF term-overlap).
  const retrieved = await searchChunks(queryEmbedding, 16, options?.category);
  const ranked = rankChunks(question, retrieved, idf);
  const top = ranked[0];

  // 3. Unknown-question gate: the question must clear BOTH the hybrid score
  //    and the coverage gate — otherwise we honestly say we don't know.
  if (!top || top.final < ANSWER_THRESHOLD || top.overlap < UNKNOWN_OVERLAP_GATE) {
    return {
      answer: buildUnknownAnswer(question, await knowledgeTitles()),
      sources: [],
      topScore: top?.final ?? 0,
      unknown: true,
    };
  }

  // 4. Grounded generation over the surviving context.
  const context = ranked
    .filter((c) => c.final >= CONTEXT_MIN && c.overlap > 0)
    .slice(0, 8);

  const answer = await generateAnswerFallback(question, context, history);

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
): Promise<string> {
  const contextBlock = context
    .map((c, i) => `[Source ${i + 1}] ${c.title} (${c.category})\n${c.content}`)
    .join("\n\n");

  const providers = [];
  if (process.env.GEMINI_API_KEY) {
    providers.push({
      name: "Gemini",
      fn: () => askGemini(question, contextBlock, history),
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
): Promise<string> {
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const system = `You are a professional, highly organized AI assistant.\nYour goal is to summarize and explain the information provided in the CONTEXT below in a very clear, structured, and professional manner.\nCRITICAL FORMATTING RULES:\n- Use Markdown bullet points (-) whenever listing multiple items, features, or steps.\n- Use **bold text** to highlight key terms, headings, or important concepts (e.g., **Methodology:**, **Scope:**).\n- Keep it highly readable and visually broken up.\nAnswer ONLY using the CONTEXT below, which is automatically retrieved from the uploaded documents.\nIf the context does not contain the answer, politely state that the information is not available in the database — never invent facts, numbers, or dates.\nDO NOT include any inline citations or source references in your text (e.g., do not write "(Source: SDD)"). The sources are already displayed separately in the UI.\n\nCONTEXT:\n${contextBlock}`;

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
): Promise<string> {
  const system = `You are a professional, highly organized AI assistant.\nYour goal is to summarize and explain the information provided in the CONTEXT below in a very clear, structured, and professional manner.\nCRITICAL FORMATTING RULES:\n- Use Markdown bullet points (-) whenever listing multiple items, features, or steps.\n- Use **bold text** to highlight key terms, headings, or important concepts (e.g., **Methodology:**, **Scope:**).\n- Keep it highly readable and visually broken up.\nAnswer ONLY using the CONTEXT below, which is automatically retrieved from the uploaded documents.\nIf the context does not contain the answer, politely state that the information is not available in the database — never invent facts, numbers, or dates.\nDO NOT include any inline citations or source references in your text (e.g., do not write "(Source: SDD)"). The sources are already displayed separately in the UI.\n\nCONTEXT:\n${contextBlock}`;

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
