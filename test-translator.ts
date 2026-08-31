import { detectAndTranslateQuery } from "./src/lib/rag";

async function run() {
  const tamilQuery = "சேர்க்கை கட்டணத்தை திரும்பப் பெறுவது எப்படி?"; // "How to get a refund of the admission fee?"
  const result = await detectAndTranslateQuery(tamilQuery);
  console.log("Result:", result);
}
run();
