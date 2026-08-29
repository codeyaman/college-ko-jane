/**
 * Deterministic dense-text embeddings — fully local, zero external API calls.
 *
 * Technique: TF-IDF weighted feature hashing. Word unigrams + bigrams are
 * extracted, stemmed, weighted by sublinear term frequency × corpus IDF
 * (maintained in the kb_stats table), then projected into a 1024-dimensional
 * vector via signed feature hashing ("hashing trick") and L2-normalized.
 * Cosine similarity over these vectors behaves like classic TF-IDF cosine —
 * strong separation between on-topic and off-topic queries — while remaining
 * a fixed-size dense vector suitable for a vector database.
 */

export const EMBEDDING_DIM = 1024;

/** IDF lookup for a term; returns ~0 for ubiquitous terms, high for rare ones. */
export type IdfLookup = (term: string) => number;

const STOPWORDS = new Set(
  (
    "a an the is are was were be been being am do does did doing have has had having " +
    "i you he she it we they them his her its our their your my me him us " +
    "and or but if then else when while for to from in on at by with about into " +
    "through of as so such that this these those there here what which who whom whose " +
    "how why where can could shall should will would may might must not no nor too very " +
    "just also than more most some any each few all both own same only over under again " +
    "once per via etc please tell give know get"
  ).split(/\s+/),
);

/** Lightweight suffix-stripping stemmer — improves term matching without a lexicon. */
export function stem(token: string): string {
  let t = token;
  if (t.length > 5 && t.endsWith("ies")) return t.slice(0, -3) + "y";
  if (t.length > 5 && t.endsWith("ing")) return t.slice(0, -3);
  if (t.length > 4 && t.endsWith("ed")) return t.slice(0, -2);
  if (t.length > 3 && t.endsWith("es")) return t.slice(0, -2);
  if (t.length > 3 && t.endsWith("s") && !t.endsWith("ss")) return t.slice(0, -1);
  return t;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9%\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(stem);
}

/** All features (unigrams + bigrams) of a text, with term frequencies. */
export function extractFeatures(text: string): Map<string, number> {
  const tokens = tokenize(text);
  const counts = new Map<string, number>();
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
  for (let i = 0; i < tokens.length - 1; i++) {
    const bg = `${tokens[i]}_${tokens[i + 1]}`;
    counts.set(bg, (counts.get(bg) ?? 0) + 1);
  }
  return counts;
}

/** Unique feature set of a text — stored per chunk for corpus statistics. */
export function termSetOf(text: string): string[] {
  return [...extractFeatures(text).keys()];
}

/** FNV-1a 32-bit — stable feature hash → bucket index. */
function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** djb2 — secondary hash used for the random sign (collision decorrelation). */
function djb2(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 33) ^ str.charCodeAt(i)) >>> 0;
  }
  return h >>> 0;
}

function featureIdf(feature: string, idf?: IdfLookup): number {
  if (!idf) return 1;
  if (feature.includes("_")) {
    const [a, b] = feature.split("_");
    return (idf(a) + idf(b)) / 2;
  }
  return idf(feature);
}

/**
 * Embed text into a 1024-dim L2-normalized TF-IDF vector.
 * Pass the corpus IDF lookup (from getIdfLookup) for retrieval-grade vectors.
 */
export function embed(text: string, idf?: IdfLookup): number[] {
  const vector = new Array<number>(EMBEDDING_DIM).fill(0);
  const features = extractFeatures(text);
  if (features.size === 0) return vector;

  for (const [feature, count] of features) {
    const idx = fnv1a(feature) % EMBEDDING_DIM;
    const sign = (djb2(feature) & 1) === 1 ? 1 : -1;
    const weight = (1 + Math.log(count)) * featureIdf(feature, idf);
    if (weight === 0) continue;
    vector[idx] += sign * weight * (feature.includes("_") ? 0.8 : 1);
  }

  const norm = Math.sqrt(vector.reduce((s, x) => s + x * x, 0)) || 1;
  for (let i = 0; i < vector.length; i++) vector[i] /= norm;
  return vector;
}

/** Cosine similarity for L2-normalized vectors == dot product. */
export function cosine(a: number[], b: number[]): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}
