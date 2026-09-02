import { db } from "@/db";
import { Doc } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { ingestDocument } from "@/lib/kb";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED = [
  ".pdf",
  ".txt",
  ".md",
  ".csv",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
];

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Please sign in." }, { status: 401 });
  }
  
  await db();
  const rows = await Doc.find().sort({ createdAt: -1 });

  return Response.json({
    documents: rows.map((d) => ({ 
      id: d._id.toString(),
      title: d.title,
      category: d.category,
      filename: d.filename,
      mimeType: d.mimeType,
      chunkCount: d.chunkCount,
      summary: d.summary,
      version: d.version || 1,
      status: d.status,
      createdAt: d.createdAt,
      size: d.contentText.length,
    })),
  });
}

async function extractTextWithVisionModel(file: File): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error(
      "OCR failed: GEMINI_API_KEY is missing from environment variables."
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  
  // Natively fall back to standard image mimes if file.type is missing
  let mimeType = file.type;
  if (!mimeType) {
    if (file.name.endsWith(".png")) mimeType = "image/png";
    else if (file.name.endsWith(".pdf")) mimeType = "application/pdf";
    else mimeType = "image/jpeg";
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Extract all text from this document accurately. Do not add conversational text. Return only the extracted text.",
              },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64,
                },
              },
            ],
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Vision API failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Vision API returned empty text.");
  return text.trim();
}

async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  
  // OCR Images directly
  if (
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".webp")
  ) {
    return extractTextWithVisionModel(file);
  }

  if (name.endsWith(".pdf")) {
    const { extractText: pdfExtract } = await import("unpdf");
    const buffer = new Uint8Array(await file.arrayBuffer());
    const result = await pdfExtract(buffer, { mergePages: true });
    let text = Array.isArray(result.text)
      ? result.text.join("\n")
      : result.text;
    
    text = (text ?? "").trim();
    // If it's a scanned PDF and unpdf didn't extract much, use OCR Fallback
    if (text.length < 50) {
      console.log(`PDF ${name} extracted only ${text.length} chars. Using OCR fallback...`);
      return extractTextWithVisionModel(file);
    }
    return text;
  }
  
  // .txt, .md, .csv
  return file.text();
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return Response.json({ error: "Please sign in." }, { status: 401 });
  }
  if (user.role !== "admin") {
    return Response.json(
      { error: "Only admins can manage the knowledge base." },
      { status: 403 },
    );
  }
  if (user.email === "demo@college.edu") {
    return Response.json(
      { error: "Action not allowed in Demo Mode." },
      { status: 403 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json(
      { error: "Expected multipart form data with a file." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file was uploaded." }, { status: 400 });
  }
  if (file.size === 0) {
    return Response.json({ error: "The file is empty." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return Response.json(
      { error: "File is too large — the limit is 10 MB." },
      { status: 400 },
    );
  }
  const lower = file.name.toLowerCase();
  if (!ACCEPTED.some((ext) => lower.endsWith(ext))) {
    return Response.json(
      { error: "Unsupported file type. Upload a .pdf, .txt, .md, .csv, or an image." },
      { status: 400 },
    );
  }

  const title =
    (form.get("title") as string | null)?.trim() ||
    file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
  const category =
    (form.get("category") as string | null)?.trim() || "General";

  let text: string;
  try {
    text = await extractText(file);
  } catch (err) {
    console.error("Text extraction failed:", err);
    return Response.json(
      {
        error:
          "Could not extract text from this file. If it is a scanned PDF, convert it to searchable text first.",
      },
      { status: 422 },
    );
  }

  try {
    const result = await ingestDocument({
      title: title.slice(0, 160),
      category: category.slice(0, 60),
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      content: text,
      uploadedBy: user.id,
    });
    return Response.json(
      {
        ok: true,
        documentId: result.documentId,
        chunkCount: result.chunkCount,
      },
      { status: 201 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to process the document.";
    return Response.json({ error: message }, { status: 422 });
  }
}
