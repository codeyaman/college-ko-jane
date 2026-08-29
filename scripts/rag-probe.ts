import "dotenv/config";
import { embed } from "@/lib/embed";
import { rankChunks, searchChunks } from "@/lib/vector";
import { getIdfLookup } from "@/lib/kb";
import {
  ANSWER_THRESHOLD,
  UNKNOWN_OVERLAP_GATE,
} from "@/lib/synthesize";

const QUERIES = [
  // in-domain (should score well above threshold)
  "What is the B.Tech fee structure?",
  "How much is the hostel fee for a single AC room?",
  "What is the attendance policy?",
  "How is CGPA calculated and converted to percentage?",
  "When does the odd semester start and when are mid semester tests?",
  "What was the highest package last year?",
  "Which clubs can I join at the college?",
  "What are the library timings and borrowing rules?",
  "What scholarships are available for toppers?",
  "When is Technovate held?",
  "what is the mess menu non veg days",
  "can i change my branch after first year",
  // out-of-domain (should fall below threshold)
  "Who won the cricket world cup?",
  "What is the recipe for paneer butter masala?",
  "Explain quantum entanglement in simple terms",
  "What is the stock price of Reliance Industries?",
];

async function main() {
  const idf = await getIdfLookup();
  for (const q of QUERIES) {
    const retrieved = await searchChunks(embed(q, idf), 8);
    const ranked = rankChunks(q, retrieved, idf);
    const top = ranked[0];
    const verdict =
      top && top.final >= ANSWER_THRESHOLD && top.overlap >= UNKNOWN_OVERLAP_GATE
        ? "ANSWER"
        : "UNKNOWN";
    console.log(
      `Q: ${q}\n  → ${verdict}  final=${top ? top.final.toFixed(3) : "-"} overlap=${top ? top.overlap.toFixed(3) : "-"} cos=${top ? top.score.toFixed(3) : "-"} doc=${top ? top.title.slice(0, 34) : "-"}\n`,
    );
  }
  process.exit(0);
}

main();
