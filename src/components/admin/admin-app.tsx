"use client";

import { useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BookMarked,
  CircleAlert,
  CircleCheck,
  DatabaseZap,
  FileText,
  FileUp,
  FolderOpen,
  GraduationCap,
  Loader2,
  LogOut,
  MessageSquare,
  Pencil,
  RefreshCw,
  Tags,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { auth as firebaseAuth } from "@/lib/firebase-client";
import { signOut } from "firebase/auth";
import type { UserVM } from "@/lib/types";
import ThemeToggle from "@/components/theme-toggle";
import { CATEGORIES } from "@/lib/constants";

interface DocRow {
  id: string;
  title: string;
  category: string;
  filename: string;
  chunkCount: number;
  status: "processing" | "ready" | "failed";
  summary?: string;
  version?: number;
  createdAt: string;
  size: number;
}

interface Stats {
  docs: number;
  chunks: number;
  categories: number;
  users: number;
  conversations: number;
  messages: number;
  thumbsUp: number;
  thumbsDown: number;
}

const UPLOAD_STEPS = [
  "Extracting text from file",
  "Chunking into passages",
  "Generating vector embeddings",
  "Storing in MongoDB & re-indexing corpus",
];

const PILL_PALETTES = [
  "border-saffron-500/30 bg-saffron-500/10 text-saffron-300",
  "border-sky-400/30 bg-sky-400/10 text-sky-300",
  "border-leaf-400/30 bg-leaf-400/10 text-leaf-400",
  "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-300",
  "border-amber-300/30 bg-amber-300/10 text-amber-200",
  "border-teal-300/30 bg-teal-300/10 text-teal-300",
  "border-rose-400/30 bg-rose-400/10 text-rose-300",
];

function pillClass(category: string): string {
  let h = 0;
  for (let i = 0; i < category.length; i++)
    h = (h * 31 + category.charCodeAt(i)) >>> 0;
  return PILL_PALETTES[h % PILL_PALETTES.length];
}

function fmtSize(chars: number): string {
  return chars < 1024 ? `${chars} B` : `${(chars / 1024).toFixed(1)} KB`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface Toast {
  id: number;
  kind: "success" | "error";
  text: string;
}

export default function AdminApp({
  user: initialUser,
  stats: initialStats,
  initialDocs,
}: {
  user: UserVM;
  stats: Stats;
  initialDocs: DocRow[];
}) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [docs, setDocs] = useState<DocRow[]>(initialDocs);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Admissions");
  const [customCat, setCustomCat] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(-1); // -1 idle, 0..3 running, 4 done
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(user.name);
  const [isSavingName, setIsSavingName] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toastSeq = useRef(0);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function pushToast(kind: Toast["kind"], text: string) {
    const id = ++toastSeq.current;
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }

  async function reload() {
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) return;
      const data = (await res.json()) as { documents: DocRow[] };
      setDocs(data.documents);
      const cats = new Set(data.documents.map((d) => d.category));
      setStats((s) => ({
        ...s,
        docs: data.documents.length,
        chunks: data.documents.reduce((a, d) => a + d.chunkCount, 0),
        categories: cats.size,
      }));
    } catch {
      /* non-fatal */
    }
  }

  function pickFile(f: File | null) {
    if (!f) return;
    const lower = f.name.toLowerCase();
    if (![".pdf", ".txt", ".md"].some((e) => lower.endsWith(e))) {
      pushToast("error", "Only .pdf, .txt and .md files are supported.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      pushToast("error", "File is too large — the limit is 10 MB.");
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  }

  async function upload() {
    if (!file || busy) return;
    setBusy(true);
    setStep(0);
    const stepTimer = setInterval(() => setStep((s) => Math.min(s + 1, 3)), 800);
    const chosenCategory =
      category === "Custom" ? customCat.trim() || "General" : category;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", title.trim() || file.name);
    fd.append("category", chosenCategory);

    try {
      const res = await fetch("/api/documents", { method: "POST", body: fd });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        chunkCount?: number;
      } | null;
      if (!res.ok) {
        throw new Error(data?.error ?? `Upload failed (${res.status}).`);
      }
      clearInterval(stepTimer);
      setStep(4);
      pushToast(
        "success",
        `"${title.trim() || file.name}" embedded — ${data?.chunkCount ?? "?"} chunks added to the vector store.`,
      );
      setFile(null);
      setTitle("");
      setCustomCat("");
      if (inputRef.current) inputRef.current.value = "";
      await reload();
      setTimeout(() => setStep(-1), 1600);
    } catch (err) {
      clearInterval(stepTimer);
      setStep(-1);
      pushToast(
        "error",
        err instanceof Error ? err.message : "Upload failed — please retry.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, docTitle: string) {
    if (confirmId !== id) {
      setConfirmId(id);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmId(null), 3000);
      return;
    }
    setConfirmId(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? `Delete failed (${res.status}).`);
      }
      pushToast("success", `"${docTitle}" removed; corpus re-indexed.`);
      await reload();
    } catch (err) {
      pushToast(
        "error",
        err instanceof Error ? err.message : "Delete failed — please retry.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await signOut(firebaseAuth);
    } catch {
      /* ignore */
    }
    router.replace("/login");
  }

  const saveName = async () => {
    const newName = editNameValue.trim();
    if (!newName || newName === user.name) {
      setIsEditingName(false);
      setEditNameValue(user.name);
      return;
    }
    setIsSavingName(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        setUser({ ...user, name: newName });
      } else {
        setEditNameValue(user.name);
      }
    } catch {
      setEditNameValue(user.name);
    }
    setIsSavingName(false);
    setIsEditingName(false);
  };

  const statCards = [
    { icon: Users, label: "Users", value: stats.users },
    { icon: MessageSquare, label: "Conversations", value: stats.conversations },
    { icon: FileText, label: "Messages", value: stats.messages },
    { icon: ThumbsUp, label: "Positive Feedback", value: stats.thumbsUp },
    { icon: ThumbsDown, label: "Negative Feedback", value: stats.thumbsDown },
    { icon: FolderOpen, label: "Documents", value: stats.docs },
    { icon: DatabaseZap, label: "Vector chunks", value: stats.chunks },
    { icon: Tags, label: "Categories", value: stats.categories },
  ];

  return (
    <div className="min-h-screen bg-ink-950 text-cream-50">
      {/* header */}
      <header className="sticky top-0 z-30 border-b border-ink-800 bg-ink-950/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
          <Link
            href="/chat"
            className="flex items-center gap-1.5 rounded-full border border-ink-700 px-3.5 py-1.5 text-xs text-ink-300 transition hover:border-saffron-500/40 hover:text-saffron-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Chat
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-saffron-400 to-saffron-600">
              <GraduationCap className="h-4.5 w-4.5 text-ink-950" strokeWidth={2.4} />
            </span>
            <div>
              <div className="flex items-center gap-2 font-display text-base tracking-tight">
                Knowledge Studio
                <span className="rounded-full bg-saffron-500/15 px-2 py-0.5 text-[9px] font-semibold tracking-widest text-saffron-300 uppercase">
                  Admin
                </span>
              </div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            {isEditingName ? (
              <input
                autoFocus
                disabled={isSavingName}
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                className="w-full max-w-[120px] truncate rounded bg-ink-900 px-1.5 py-0.5 text-[13px] font-medium text-cream-100 outline-none ring-1 ring-saffron-500/50"
              />
            ) : (
              <div className="group/name flex items-center gap-1.5">
                <span className="hidden text-xs text-ink-400 sm:block">
                  {user.name}
                </span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-ink-600 opacity-0 transition group-hover/name:opacity-100 hover:text-saffron-400"
                  aria-label="Edit name"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
            )}
            <button
              onClick={logout}
              aria-label="Sign out"
              className="rounded-lg p-2 text-ink-400 transition hover:bg-ink-800 hover:text-rose-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {/* stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-ink-700 bg-ink-900/60 p-5"
            >
              <s.icon className="h-4.5 w-4.5 text-saffron-400" strokeWidth={1.8} />
              <div className="mt-3 font-display text-3xl text-cream-50">
                {s.value}
              </div>
              <div className="mt-1 text-[11px] tracking-[0.14em] text-ink-400 uppercase">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {/* upload panel */}
          <section className="rounded-2xl border border-ink-700 bg-ink-900/60 p-6">
            <h2 className="flex items-center gap-2 font-display text-xl">
              <FileUp className="h-5 w-5 text-saffron-400" />
              Teach the assistant
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-400">
              Upload college documents (.pdf, .txt, .md, .csv, images). They are chunked,
              embedded into 1024-dim vectors and stored in Postgres — ready to
              be cited within seconds.
            </p>

            {/* dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-9 text-center transition ${
                dragOver
                  ? "border-saffron-400/70 bg-saffron-500/10"
                  : file
                    ? "border-leaf-400/40 bg-leaf-400/5"
                    : "border-ink-600 bg-ink-950/50 hover:border-saffron-500/40"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.txt,.md,.csv,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <>
                  <FileText className="h-8 w-8 text-leaf-400" />
                  <p className="mt-3 max-w-full truncate text-sm font-medium text-cream-100">
                    {file.name}
                  </p>
                  <p className="mt-1 text-xs text-ink-400">
                    {(file.size / 1024).toFixed(1)} KB · ready to embed
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                    className="mt-3 inline-flex items-center gap-1 rounded-full border border-ink-600 px-2.5 py-1 text-[11px] text-ink-300 transition hover:border-rose-400/50 hover:text-rose-400"
                  >
                    <X className="h-3 w-3" /> remove
                  </button>
                </>
              ) : (
                <>
                  <FileUp className="h-8 w-8 text-saffron-400" />
                  <p className="mt-3 text-sm text-cream-100">
                    Drop a file here, or{" "}
                    <span className="text-saffron-300 underline underline-offset-2">
                      browse
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-ink-500">
                    PDF, TXT, MD, CSV, or Images · up to 10 MB
                  </p>
                </>
              )}
            </div>

            {/* meta fields */}
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-ink-300">
                  Document title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={160}
                  placeholder="e.g. Hostel Fee Circular 2026"
                  className="ring-field w-full rounded-xl border border-ink-600 bg-ink-950 px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium tracking-wide text-ink-300">
                  Category
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`rounded-full border px-3 py-1 text-[11px] transition ${
                        category === c
                          ? "border-saffron-400/70 bg-saffron-500/15 text-saffron-200"
                          : "border-ink-600 text-ink-400 hover:border-ink-500 hover:text-ink-200"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                {category === "Custom" && (
                  <input
                    value={customCat}
                    onChange={(e) => setCustomCat(e.target.value)}
                    maxLength={60}
                    placeholder="Custom category name"
                    className="ring-field mt-2 w-full rounded-xl border border-ink-600 bg-ink-950 px-3.5 py-2.5 text-sm outline-none placeholder:text-ink-500"
                  />
                )}
              </div>
            </div>

            <button
              onClick={upload}
              disabled={!file || busy}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-saffron-400 to-saffron-600 py-3 text-sm font-semibold text-ink-950 shadow-[0_16px_44px_-14px_rgba(255,122,26,0.6)] transition hover:shadow-[0_20px_54px_-12px_rgba(255,122,26,0.75)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <DatabaseZap className="h-4 w-4" />
                  Process &amp; embed document
                </>
              )}
            </button>

            {/* pipeline steps */}
            <AnimatePresence>
              {step >= 0 && (
                <motion.ul
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-2 overflow-hidden"
                >
                  {UPLOAD_STEPS.map((s, i) => {
                    const state =
                      step > i || step === 4 ? "done" : step === i ? "run" : "wait";
                    return (
                      <li
                        key={s}
                        className={`flex items-center gap-2.5 text-xs ${
                          state === "wait" ? "text-ink-600" : "text-ink-200"
                        }`}
                      >
                        {state === "done" ? (
                          <CircleCheck className="h-4 w-4 text-leaf-400" />
                        ) : state === "run" ? (
                          <Loader2 className="h-4 w-4 animate-spin text-saffron-400" />
                        ) : (
                          <span className="h-4 w-4 rounded-full border border-ink-700" />
                        )}
                        {s}
                      </li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>

            <div className="mt-5 rounded-xl border border-ink-700 bg-ink-950/60 p-4 text-[11px] leading-relaxed text-ink-400">
              <span className="mb-1 flex items-center gap-1.5 font-medium text-ink-200">
                <RefreshCw className="h-3 w-3 text-saffron-400" />
                Auto re-indexing
              </span>
              Every upload or deletion recomputes corpus IDF statistics and
              re-embeds all chunks, so retrieval quality stays consistent as the
              knowledge base evolves.
            </div>
          </section>

          {/* documents table */}
          <section className="rounded-2xl border border-ink-700 bg-ink-900/60">
            <div className="flex items-center justify-between border-b border-ink-800 px-6 py-4">
              <h2 className="flex items-center gap-2 font-display text-xl">
                <BookMarked className="h-5 w-5 text-saffron-400" />
                Knowledge base
              </h2>
              <button
                onClick={reload}
                className="rounded-lg p-2 text-ink-400 transition hover:bg-ink-800 hover:text-cream-100"
                aria-label="Refresh list"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            <div className="scroll-slim max-h-[560px] divide-y divide-ink-800 overflow-y-auto">
              {docs.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <FolderOpen className="mx-auto h-8 w-8 text-ink-600" />
                  <p className="mt-3 text-sm text-ink-400">
                    The knowledge base is empty.
                  </p>
                  <p className="mt-1 text-xs text-ink-500">
                    Upload your first document — or run{" "}
                    <code className="rounded bg-ink-800 px-1.5 py-0.5 text-saffron-300">
                      npx tsx src/db/seed.ts
                    </code>{" "}
                    to load the demo corpus.
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {docs.map((d) => (
                    <motion.div
                      key={d.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-4 px-6 py-4"
                    >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink-700 bg-ink-950">
                      <FileText className="h-4.5 w-4.5 text-saffron-400" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-cream-100">
                            {d.title}
                          </p>
                          {d.version && d.version > 1 && (
                            <span className="shrink-0 rounded-full border border-saffron-500/40 bg-saffron-500/10 px-2 py-0.5 text-[10px] font-semibold text-saffron-300">
                              v{d.version}
                            </span>
                          )}
                          <span
                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] ${pillClass(d.category)}`}
                          >
                            {d.category}
                          </span>
                        </div>
                        {d.summary && (
                          <div className="text-xs text-ink-300 line-clamp-2 pr-8 leading-relaxed">
                            {d.summary}
                          </div>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-ink-500">
                        {d.filename} · {d.chunkCount} chunks · {fmtSize(d.size)} ·{" "}
                        {fmtDate(d.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => remove(d.id, d.title)}
                      disabled={deletingId === d.id}
                      className={`shrink-0 rounded-lg border px-3 py-1.5 text-[11px] transition ${
                        confirmId === d.id
                          ? "border-rose-400/60 bg-rose-400/10 font-semibold text-rose-400"
                          : "border-ink-700 text-ink-400 hover:border-rose-400/40 hover:text-rose-400"
                      } disabled:opacity-50`}
                    >
                      {deletingId === d.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : confirmId === d.id ? (
                        "Confirm?"
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* toast stack */}
      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-2xl shadow-black/50 ${
                t.kind === "success"
                  ? "border-leaf-400/30 bg-ink-900 text-leaf-400"
                  : "border-rose-400/30 bg-ink-900 text-rose-400"
              }`}
            >
              {t.kind === "success" ? (
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span className="text-cream-100/90">{t.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
