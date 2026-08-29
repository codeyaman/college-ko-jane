/**
 * Answer synthesis — the generation step of RAG when no external LLM key is
 * configured. Produces fluent, grounded answers from retrieved chunks by
 * scoring sentences against the question, selecting the strongest evidence,
 * and reassembling it in narrative order. Sources are always attached.
 */

import { tokenize } from "./embed";
import type { RankedChunk, RetrievedChunk } from "./vector";
import { Message, type IMessageSource } from "@/db/schema";

/** Hybrid-score gates for answerable vs. unknown questions. */
export const ANSWER_THRESHOLD = 0.15;
export const UNKNOWN_OVERLAP_GATE = 0.02;
export const CONTEXT_MIN = 0.10;

export function confidenceLabel(score: number): "high" | "medium" | "low" {
  if (score >= 0.62) return "high";
  if (score >= 0.45) return "medium";
  return "low";
}

const DOT_GUARD = "@@DOT@@";

export function splitSentences(text: string): string[] {
  // Protect common abbreviations ("Dr.", "Prof.", …) from sentence splits.
  const guarded = text.replace(/\b(Dr|Mr|Mrs|Ms|Prof|St|No|vs)\./g, `$1${DOT_GUARD}`);
  return guarded
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.replaceAll(DOT_GUARD, ".").trim())
    .filter(Boolean);
}

function cleanSentence(s: string): string {
  let t = s
    .replace(/^[-–—•*▪\s]+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (t && !/[.!?]$/.test(t)) t += ".";
  return t;
}

/**
 * Build citation list from ranked context. A relative quality floor keeps
 * only sources that genuinely contributed — weak peripheral chunks are cut.
 */
export function buildSources(chunks: RankedChunk[], question?: string): IMessageSource[] {
  if (chunks.length === 0) return [];
  const topFinal = chunks[0].final;
  const floor = Math.max(0.3 * topFinal, 0.2);
  const byDoc = new Map<string, IMessageSource>();
  
  const qTerms = question ? new Set(tokenize(question)) : new Set<string>();

  for (const c of chunks) {
    if (c.final < floor) continue;
    const prev = byDoc.get(c.documentId);
    if (!prev || c.final > prev.score) {
      
      let bestSnippet = c.content.trim();
      if (bestSnippet.length > 200) {
        bestSnippet = bestSnippet.slice(0, 200) + "...";
      }

      byDoc.set(c.documentId, {
        documentId: c.documentId,
        title: c.title,
        category: c.category,
        score: Math.round(c.final * 100) / 100,
        snippet: bestSnippet,
      });
    }
  }
  return [...byDoc.values()].sort((a, b) => b.score - a.score).slice(0, 4);
}

interface Candidate {
  text: string;
  chunkRank: number;
  sentIdx: number;
  value: number;
  overlap: number;
}

export function synthesizeAnswer(
  question: string,
  chunks: RetrievedChunk[],
): string {
  const qTerms = new Set(tokenize(question));
  const cands: Candidate[] = [];

  chunks.slice(0, 4).forEach((c, chunkRank) => {
    splitSentences(c.content.replace(/\n+/g, " ")).forEach((raw, sentIdx) => {
      const s = cleanSentence(raw);
      if (s.length < 24 || s.split(" ").length < 4) return;
      const terms = tokenize(s);
      if (terms.length === 0) return;
      let overlap = 0;
      for (const t of terms) if (qTerms.has(t)) overlap++;
      const density = overlap / Math.sqrt(terms.length);
      const value = c.score * 2.2 + overlap * 0.8 + density - sentIdx * 0.02;
      cands.push({ text: s, chunkRank, sentIdx, value, overlap });
    });
  });

  cands.sort((a, b) => b.value - a.value);
  const chosen: Candidate[] = [];
  const perChunk = new Map<number, number>();
  for (const c of cands) {
    if (chosen.length >= 7) break;
    const used = perChunk.get(c.chunkRank) ?? 0;
    if (used >= 3) continue;
    if (c.overlap === 0 && chosen.length >= 2) continue;
    if (chosen.some((o) => o.text.slice(0, 60) === c.text.slice(0, 60)))
      continue;
    chosen.push(c);
    perChunk.set(c.chunkRank, used + 1);
  }

  if (chosen.length === 0) {
    splitSentences(chunks[0].content.replace(/\n+/g, " "))
      .slice(0, 3)
      .forEach((s, i) =>
        chosen.push({
          text: cleanSentence(s),
          chunkRank: 0,
          sentIdx: i,
          value: 0,
          overlap: 0,
        }),
      );
  }

  // Narrative order: follow the original chunk/sentence sequence.
  chosen.sort((a, b) => a.chunkRank - b.chunkRank || a.sentIdx - b.sentIdx);

  const titles = [...new Set(chunks.slice(0, 3).map((c) => c.title))];
  const lead =
    titles.length > 1
      ? `Based on the knowledge base (**${titles[0]}**, **${titles[1]}**):`
      : `Based on **${titles[0]}** in the knowledge base:`;

  const paragraphs: string[] = [];
  let cur: string[] = [];
  let lastRank = -1;
  for (const c of chosen) {
    if (c.chunkRank !== lastRank && cur.length) {
      paragraphs.push(cur.join(" "));
      cur = [];
    }
    cur.push(c.text);
    lastRank = c.chunkRank;
  }
  if (cur.length) paragraphs.push(cur.join(" "));

  return [lead, "", paragraphs.join("\n\n")].join("\n");
}

const SUGGESTION_BANK: [RegExp, string][] = [
  [/admission/, "How do I apply for admission?"],
  [/fee/, "What is the B.Tech fee structure?"],
  [/scholarship|financial/, "What scholarships are available?"],
  [/hostel|accommodation/, "What are the hostel rules and fees?"],
  [/library/, "What are the library timings?"],
  [/placement|career/, "How were last year's placements?"],
  [/exam|grading/, "How is the CGPA calculated?"],
  [/calendar/, "When does the odd semester start?"],
  [/club|student life/, "Which clubs can I join?"],
  [/policies|conduct/, "What is the attendance policy?"],
  [/events|fest/, "When is the annual tech fest?"],
  [/programs|department/, "Which B.Tech branches are offered?"],
];

export function buildUnknownAnswer(
  question: string,
  docTitles: string[],
): string {
  void question;
  const picks: string[] = [];
  for (const [re, q] of SUGGESTION_BANK) {
    if (docTitles.some((t) => re.test(t.toLowerCase())) && !picks.includes(q)) {
      picks.push(q);
    }
    if (picks.length >= 4) break;
  }
  const suggestions = picks.length
    ? picks
    : [
        "What programs does the college offer?",
        "What is the fee structure?",
        "How do I apply for admission?",
      ];
  return [
    `I searched the college knowledge base but couldn't find reliable information about that yet. I only answer from officially uploaded documents — so I won't guess.`,
    "",
    "You could try asking:",
    ...suggestions.map((s) => `- ${s}`),
    "",
    "If this topic should be covered, an admin can upload the relevant document on the **Knowledge Base** page and I'll be able to answer it from then on.",
  ].join("\n");
}
