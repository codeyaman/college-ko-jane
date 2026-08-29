/**
 * Vector store layer — semantic search that runs on MongoDB Atlas.
 *
 * Uses MongoDB Atlas `$vectorSearch` aggregation pipeline to find the most
 * similar chunks based on cosine similarity.
 *
 * NOTE: This requires an Atlas Vector Search index to be configured on the
 * `chunks` collection with the following definition:
 * {
 *   "fields": [
 *     { "type": "vector", "path": "embedding", "numDimensions": 1024, "similarity": "cosine" }
 *   ]
 * }
 */

import { Chunk, Doc } from "@/db/schema";
import { tokenize, type IdfLookup } from "./embed";
import { db } from "@/db";

export interface RetrievedChunk {
  id: string;
  content: string;
  chunkIndex: number;
  documentId: string;
  title: string;
  category: string;
  score: number;
  termSet: string[];
}

export interface RankedChunk extends RetrievedChunk {
  /** IDF-weighted fraction of query terms present in the chunk (0..1). */
  overlap: number;
  /** Hybrid rank: vector cosine + overlap boost. */
  final: number;
}

export function rankChunks(
  question: string,
  retrieved: RetrievedChunk[],
  idf?: IdfLookup,
): RankedChunk[] {
  const qTerms = [...new Set(tokenize(question))];
  const weights = qTerms.map((t) => ({ t, w: idf ? idf(t) : 1 }));
  const total = weights.reduce((s, x) => s + x.w, 0) || 1;
  return retrieved
    .map((c) => {
      const set = new Set(c.termSet ?? []);
      let matched = 0;
      for (const { t, w } of weights) if (set.has(t)) matched += w;
      const overlap = matched / total;
      return { ...c, overlap, final: c.score + 0.35 * overlap };
    })
    .sort((a, b) => b.final - a.final);
}

export async function searchChunks(
  queryEmbedding: number[],
  k = 6,
): Promise<RetrievedChunk[]> {
  await db();

  // We use MongoDB Atlas $vectorSearch to find the top K chunks.
  // Note: We cannot easily filter by document status="ready" natively inside
  // $vectorSearch without indexing the filter field in the Atlas Search index,
  // so we'll fetch a slightly larger pool and filter it after joining.
  
  const pipeline = [
    {
      $vectorSearch: {
        index: "vector_index", // Name of the Atlas Vector Search Index
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: k * 10,
        limit: k * 3,
      }
    },
    {
      $lookup: {
        from: "documents",
        localField: "documentId",
        foreignField: "_id",
        as: "document"
      }
    },
    {
      $unwind: "$document"
    },
    {
      $match: {
        "document.status": "ready"
      }
    },
    {
      $limit: k
    },
    {
      $project: {
        _id: 1,
        content: 1,
        chunkIndex: 1,
        documentId: 1,
        termSet: 1,
        title: "$document.title",
        category: "$document.category",
        score: { $meta: "vectorSearchScore" }
      }
    }
  ];

  const results = await Chunk.aggregate(pipeline);

  return results.map((r) => ({
    id: r._id.toString(),
    content: r.content,
    chunkIndex: r.chunkIndex,
    documentId: r.documentId.toString(),
    title: r.title,
    category: r.category,
    termSet: r.termSet,
    score: r.score
  }));
}
