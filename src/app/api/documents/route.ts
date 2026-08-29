import { db } from "@/db";
import { Doc } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { ingestDocument } from "@/lib/kb";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED = [".pdf", ".txt", ".md"];

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
      status: d.status,
      createdAt: d.createdAt,
      size: d.contentText.length,
    })),
  });
}

async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) {
    const { extractText: pdfExtract } = await import("unpdf");
    const buffer = new Uint8Array(await file.arrayBuffer());
    const result = await pdfExtract(buffer, { mergePages: true });
    const text = Array.isArray(result.text)
      ? result.text.join("\n")
      : result.text;
    return text ?? "";
  }
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
      { error: "Unsupported file type. Upload a .pdf, .txt or .md file." },
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
