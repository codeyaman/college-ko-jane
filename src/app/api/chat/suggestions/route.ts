import { db } from "@/db";
import { Doc } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db();
    
    // 1. Fetch document titles to base suggestions on
    const rows = await Doc.find({ status: "ready" }).select("title category").limit(20);

    if (rows.length === 0) {
      return Response.json({
        suggestions: [
          "What is the fee structure?",
          "Tell me about the hostel facilities",
          "What are the admission requirements?",
          "How are the placements here?",
        ],
      });
    }

    const docsList = rows
      .map((r) => `- ${r.title} (Category: ${r.category})`)
      .join("\n");

    const prompt = `You are an AI assistant for a college. The knowledge base contains the following documents:
${docsList}

Generate exactly 4 distinct, engaging, and highly relatable questions a student might ask based on these specific documents. 
The questions should be conversational and natural (e.g. "What is the hostel fee for an AC room?", "Can you summarize the placement policy?").
Return ONLY a JSON array of 4 strings. Do not include markdown code blocks or any other text.`;

    let suggestions = [
      "What is the fee structure?",
      "Tell me about the hostel facilities",
      "What are the admission requirements?",
      "How are the placements here?",
    ];

    const model = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";
    const key = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;

    if (key) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.7,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          let text = data.choices?.[0]?.message?.content?.trim() || "";
          
          // Clean up potential markdown formatting if the LLM adds it
          if (text.startsWith("\`\`\`json")) {
            text = text.replace(/^\`\`\`json/, "").replace(/\`\`\`$/, "").trim();
          } else if (text.startsWith("\`\`\`")) {
            text = text.replace(/^\`\`\`/, "").replace(/\`\`\`$/, "").trim();
          }

          const parsed = JSON.parse(text);
          if (Array.isArray(parsed) && parsed.length >= 2) {
            suggestions = parsed.slice(0, 4).map(String);
          }
        }
      } catch (err) {
        console.error("AI Suggestions generation failed, using fallback:", err);
      }
    }

    return Response.json({ suggestions });
  } catch (err) {
    console.error("Suggestions error:", err);
    return Response.json(
      {
        suggestions: [
          "What is the fee structure?",
          "Tell me about the hostel facilities",
          "What are the admission requirements?",
          "How are the placements here?",
        ],
      },
      { status: 200 } // fallback
    );
  }
}
