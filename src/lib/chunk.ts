/**
 * Text chunking for the RAG ingestion pipeline.
 *
 * Strategy: normalize whitespace → split on paragraph boundaries → split
 * oversized paragraphs on sentence boundaries → greedily pack units into
 * ~1000-char chunks with a small trailing overlap so context isn't severed
 * at chunk edges.
 */

export interface TextChunk {
  index: number;
  content: string;
}

const TARGET = 1500;
const OVERLAP = 250;

function splitSentences(text: string): string[] {
  const parts: string[] = [];
  const re = /[^.!?\n]+[.!?]+["')\]]*\s*|[^.!?\n]+$/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const s = m[0].trim();
    if (s) parts.push(s);
  }
  return parts.length ? parts : [text];
}

export function normalizeText(raw: string): string {
  return raw
    .replace(/\r/g, "")
    .replace(/[ \t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function chunkText(raw: string): TextChunk[] {
  const clean = normalizeText(raw);
  if (!clean) return [];

  // 1. Break into atomic units (paragraphs, splitting huge ones by sentence).
  const units: string[] = [];
  for (const para of clean.split(/\n{2,}/)) {
    const p = para.trim();
    if (!p) continue;
    if (p.length <= TARGET) {
      units.push(p);
    } else {
      let buf = "";
      for (const s of splitSentences(p)) {
        if ((buf + " " + s).trim().length > TARGET && buf) {
          units.push(buf.trim());
          buf = s;
        } else {
          buf = (buf + " " + s).trim();
        }
      }
      if (buf.trim()) units.push(buf.trim());
    }
  }

  // 2. Greedily pack units, carrying a small overlap from the tail.
  const chunks: TextChunk[] = [];
  let current = "";
  for (const unit of units) {
    const next = current ? `${current}\n\n${unit}` : unit;
    if (next.length > TARGET && current) {
      chunks.push({ index: chunks.length, content: current.trim() });
      const tail = current.slice(-OVERLAP).trim();
      current = tail ? `${tail}\n${unit}` : unit;
    } else {
      current = next;
    }
  }
  if (current.trim()) chunks.push({ index: chunks.length, content: current.trim() });

  // 3. Drop near-empty fragments (bare headings etc.) unless it's all we have.
  const filtered = chunks.filter((c) => c.content.length >= 30);
  return (filtered.length ? filtered : chunks).map((c, i) => ({
    index: i,
    content: c.content,
  }));
}
