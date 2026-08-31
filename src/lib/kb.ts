/**
 * Knowledge-base maintenance — ingestion, corpus statistics, re-embedding.
 *
 * Backed by MongoDB Atlas.
 */

import { db } from "@/db";
import { generateDocumentSummary, generateFAQsFromDocument } from "./rag";
import { Chunk, Doc, KbStats, FAQ } from "@/db/schema";
import { chunkText, normalizeText } from "./chunk";
import { embed, termSetOf, type IdfLookup } from "./embed";

const STATS_ID = "main";

export async function getIdfLookup(): Promise<IdfLookup | undefined> {
  await db();
  const stats = await KbStats.findById(STATS_ID);
  if (!stats || stats.chunkTotal === 0) return undefined;
  
  const N = stats.chunkTotal;
  const df = stats.df as Map<string, number>;
  const maxIdf = Math.log(1 + (N + 0.5) / 0.5);
  
  return (term: string) => {
    const d = df.get(term) ?? 0;
    if (d === 0) return maxIdf;
    return Math.log(1 + (N - d + 0.5) / (d + 0.5));
  };
}

export async function reembedCorpus(): Promise<void> {
  await db();
  
  const chunks = await Chunk.find().populate("documentId");
  
  const df = new Map<string, number>();
  for (const row of chunks) {
    const terms = (row.termSet as string[]) || [];
    for (const term of new Set<string>(terms)) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }
  
  const N = chunks.length;
  const maxIdf = Math.log(1 + (N + 0.5) / 0.5);
  const idf: IdfLookup = (term) => {
    const d = df.get(term) ?? 0;
    return d === 0 ? maxIdf : Math.log(1 + (N - d + 0.5) / (d + 0.5));
  };

  const dfObj: Record<string, number> = Object.fromEntries(df);
  
  await KbStats.findByIdAndUpdate(
    STATS_ID,
    { df: dfObj, chunkTotal: N, updatedAt: new Date() },
    { upsert: true, new: true }
  );

  const BATCH = 20;
  for (let i = 0; i < chunks.length; i += BATCH) {
    await Promise.all(
      chunks.slice(i, i + BATCH).map(async (row) => {
        const title = (row.documentId as any)?.title || "";
        row.embedding = embed(
          `${title}. ${title}. ${title}.\n${row.content}`,
          idf,
        );
        await row.save();
      }),
    );
  }
}

export interface IngestResult {
  documentId: string;
  chunkCount: number;
}

export async function ingestDocument(input: {
  title: string;
  category: string;
  filename: string;
  mimeType: string;
  content: string;
  uploadedBy?: string | null;
}): Promise<IngestResult> {
  await db();
  
  const content = normalizeText(input.content);
  if (content.length < 30) {
    throw new Error("Document is too short — no usable text was extracted.");
  }
  
  const parts = chunkText(content);
  if (parts.length === 0) {
    throw new Error("Document produced no chunks.");
  }

  let summary: string | undefined;
  try {
    summary = await generateDocumentSummary(content);
  } catch (err) {
    console.warn("Summary generation failed during ingestion:", err);
  }

  const doc = await Doc.create({
    title: input.title,
    category: input.category,
    filename: input.filename,
    mimeType: input.mimeType,
    contentText: content,
    chunkCount: parts.length,
    summary,
    status: "ready",
    uploadedBy: input.uploadedBy || null,
  });

  try {
    const faqs = await generateFAQsFromDocument(content);
    if (faqs.length > 0) {
      await FAQ.insertMany(
        faqs.map((f) => ({
          question: f.question,
          answer: f.answer,
          category: input.category,
          documentId: doc._id,
        }))
      );
    }
  } catch (err) {
    console.warn("FAQ generation failed during ingestion:", err);
  }

  const chunkDocs = parts.map((c) => ({
    documentId: doc._id,
    chunkIndex: c.index,
    content: c.content,
    embedding: embed(`${input.title}\n${c.content}`),
    termSet: termSetOf(c.content),
    tokenCount: c.content.split(/\s+/).length,
  }));

  await Chunk.insertMany(chunkDocs);

  await reembedCorpus();
  
  return { documentId: doc._id.toString(), chunkCount: parts.length };
}

export async function deleteDocument(documentId: string): Promise<boolean> {
  await db();
  const deleted = await Doc.findByIdAndDelete(documentId);
  if (!deleted) return false;
  
  await Chunk.deleteMany({ documentId });
  await FAQ.deleteMany({ documentId });
  await reembedCorpus();
  
  return true;
}
