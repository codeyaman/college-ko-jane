/**
 * Idempotent seed script — run with:  npx tsx src/db/seed.ts
 *
 * 1. Creates demo accounts (admin + student) if missing.
 * 2. Loads the knowledge-base documents, chunks them, embeds every chunk
 *    and stores vectors in MongoDB — only when the KB is empty.
 */

import "dotenv/config";

import { db } from "@/db";
import { Doc, User } from "@/db/schema";
import { ingestDocument } from "@/lib/kb";
import { SEED_DOCS } from "@/db/seed-data";

const ACCOUNTS = [
  {
    name: "Prof. Ananya Sharma",
    email: "admin@college.edu",
    password: "admin@123",
    role: "admin" as const,
  },
  {
    name: "Rahul Verma",
    email: "student@college.edu",
    password: "student@123",
    role: "student" as const,
  },
];

async function main() {
  await db(); // Connect to MongoDB Atlas

  console.log("→ Seeding accounts…");
  for (const acc of ACCOUNTS) {
    const existing = await User.findOne({ email: acc.email });
    if (!existing) {
      await User.create({
        name: acc.name,
        email: acc.email,
        role: acc.role,
      });
      console.log(`  ✓ created ${acc.role}: ${acc.email}`);
    } else {
      console.log(`  • ${acc.email} already exists — skipped`);
    }
  }

  console.log("→ Checking knowledge base…");
  const docCount = await Doc.countDocuments();
  
  if (docCount > 0) {
    console.log(`  • ${docCount} documents already present — KB seed skipped`);
    console.log("Done.");
    process.exit(0);
  }

  console.log(`→ Seeding ${SEED_DOCS.length} knowledge-base documents…`);
  const admin = await User.findOne({ email: "admin@college.edu" });

  let totalChunks = 0;
  for (const doc of SEED_DOCS) {
    const result = await ingestDocument({
      title: doc.title,
      category: doc.category,
      filename: doc.filename,
      mimeType: "text/plain",
      content: doc.content,
      uploadedBy: admin?._id?.toString() ?? null,
    });
    totalChunks += result.chunkCount;
    console.log(`  ✓ ${doc.title} → ${result.chunkCount} chunks embedded`);
  }

  console.log(
    `\nDone. ${SEED_DOCS.length} documents, ${totalChunks} embedded chunks.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
