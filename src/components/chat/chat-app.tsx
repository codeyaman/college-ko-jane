"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookMarked,
  BookOpenText,
  CircleAlert,
  Database,
  Download,
  GraduationCap,
  Loader2,
  LogOut,
  Menu,
  MessageSquareText,
  Pencil,
  Plus,
  SendHorizontal,
  Sparkles,
  Trash2,
  TriangleAlert,
  X,
  ThumbsUp,
  ThumbsDown,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  HelpCircle,
} from "lucide-react";
import { auth as firebaseAuth } from "@/lib/firebase-client";
import { signOut } from "firebase/auth";
import type {
  ChatMessageVM,
  ConversationVM,
  KbInfo,
  SourceRef,
  UserVM,
} from "@/lib/types";
import { Markdown } from "./markdown";
import ThemeToggle from "@/components/theme-toggle";
import { CATEGORIES } from "@/lib/constants";

const DEFAULT_SUGGESTIONS = [
  "What is the B.Tech fee structure?",
  "Tell me about hostel rooms and mess",
  "What was the highest placement package?",
  "What is the attendance rule?",
];

function makeTitle(q: string): string {
  const words = q.replace(/\s+/g, " ").trim().split(" ").slice(0, 8).join(" ");
  const t = words.length < q.trim().length ? `${words}…` : words;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((today.getTime() - that.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function confidenceMeta(c?: number | null) {
  if (c == null || c <= 0) return null;
  if (c >= 0.62)
    return {
      label: "High confidence",
      cls: "border-leaf-400/30 bg-leaf-400/10 text-leaf-400",
    };
  if (c >= 0.45)
    return {
      label: "Medium confidence",
      cls: "border-saffron-500/30 bg-saffron-500/10 text-saffron-300",
    };
  return {
    label: "Low confidence",
    cls: "border-ink-500/40 bg-ink-700/40 text-ink-300",
  };
}

/* --------------------------------- pieces --------------------------------- */

function ThinkingBubble() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex gap-1">
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-saffron-400" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-saffron-400" />
        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-saffron-400" />
      </span>
      <span className="shimmer-text text-xs">
        Embedding question · searching vectors · grounding answer…
      </span>
    </div>
  );
}


function AssistantMessage({ msg, speakMessage, speakingMsgId, handleFeedback }: { 
  msg: ChatMessageVM, 
  speakMessage: (id: string, text: string) => void,
  speakingMsgId: string | null,
  handleFeedback: (id: string, val: 1 | -1) => void
}) {
  const conf = confidenceMeta(msg.confidence);
  const [feedback, setFeedback] = useState<1 | -1 | null>(msg.feedback ?? null);
  const [submitting, setSubmitting] = useState(false);

  async function onFeedback(val: 1 | -1) {
    if (submitting || msg.pending) return;
    const newVal = feedback === val ? null : val;
    setFeedback(newVal);
    setSubmitting(true);
    try {
      await fetch(`/api/messages/${msg.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: newVal }),
      });
      handleFeedback(msg.id, newVal ?? 0 as any);
    } catch {
      setFeedback(feedback); // revert on error
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
      className="flex gap-3.5"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-saffron-400 to-saffron-600 shadow-lg shadow-saffron-600/25">
        <Sparkles className="h-4 w-4 text-ink-950" strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold tracking-wide text-cream-100">
            College Ko Jano
          </span>
          {msg.unknown && (
            <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-saffron-500/40 bg-saffron-500/5 px-2 py-0.5 text-[10px] text-saffron-300">
              <TriangleAlert className="h-2.5 w-2.5" />
              Not in knowledge base
            </span>
          )}
          {conf && !msg.unknown && (
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] ${conf.cls}`}
            >
              {conf.label}
            </span>
          )}
        </div>
        <div
          className={`max-w-3xl text-sm text-cream-100/90 ${
            msg.unknown
              ? "rounded-2xl rounded-tl-md border border-dashed border-ink-600 bg-ink-900/50 px-4 py-3.5"
              : ""
          }`}
        >
          {msg.pending && msg.content === "" ? (
            <ThinkingBubble />
          ) : msg.errorText ? (
            <p className="flex items-start gap-2 text-rose-400">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              {msg.errorText}
            </p>
          ) : (
            <Markdown text={msg.content} />
          )}
        </div>
        {msg.sources && msg.sources.length > 0 && !msg.pending && (
          <div className="flex items-end justify-between gap-4 mt-4 border-t border-ink-700/60 pt-3">
            <div className="flex-1">
              <p className="mb-2 text-[10px] font-medium tracking-[0.2em] text-ink-500 uppercase">
                Sources
              </p>
              <div className="flex flex-wrap gap-2">
                {msg.sources.map((s, i) => (
                  <span
                    key={`${s.documentId}-${i}`}
                    className="flex items-center gap-1.5 rounded-full border border-saffron-500/25 bg-saffron-500/10 px-3 py-1.5 text-[11px] text-saffron-300"
                  >
                    <BookOpenText className="h-3 w-3" />
                    {s.title}
                    <span className="text-saffron-500/80">
                      {Math.round(s.score * 100)}%
                    </span>
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => speakMessage(msg.id, msg.content)}
                className={`p-1.5 transition ${
                  speakingMsgId === msg.id
                    ? "text-saffron-400"
                    : "text-ink-500 hover:text-saffron-300"
                }`}
                title={speakingMsgId === msg.id ? "Stop reading" : "Read aloud"}
              >
                {speakingMsgId === msg.id ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
              {!msg.unknown && (
                <>
                  <button
                    onClick={() => onFeedback(1)}
                    disabled={submitting}
                    aria-label="Helpful"
                    className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                      feedback === 1
                        ? "bg-leaf-500/20 text-leaf-400"
                        : "text-ink-500 hover:bg-ink-800 hover:text-leaf-400"
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onFeedback(-1)}
                    disabled={submitting}
                    aria-label="Not helpful"
                    className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                      feedback === -1
                        ? "bg-rose-500/20 text-rose-400"
                        : "text-ink-500 hover:bg-ink-800 hover:text-rose-400"
                    }`}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ----------------------------------- app ---------------------------------- */

export default function ChatApp({
  user: initialUser,
  initialConversations,
  kb,
}: {
  user: UserVM;
  initialConversations: ConversationVM[];
  kb: KbInfo;
}) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [convos, setConvos] = useState<ConversationVM[]>(initialConversations);
  const [activeId, _setActiveId] = useState<string | null>(null);

  const setActiveId = useCallback((id: string | null) => {
    _setActiveId(id);
    if (typeof window !== "undefined") {
      if (id) {
        window.history.replaceState(null, "", `?c=${id}`);
      } else {
        window.history.replaceState(null, "", window.location.pathname);
      }
    }
  }, []);
  const [messages, setMessages] = useState<ChatMessageVM[]>([]);
  const [draft, setDraft] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(user.name);
  const [isSavingName, setIsSavingName] = useState(false);

  // Web Speech API states
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streamCtl = useRef<{
    buffer: string;
    done: null | {
      sources?: SourceRef[];
      confidence?: number;
      unknown?: boolean;
      error?: string;
    };
  }>({ buffer: "", done: null });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onstart = () => setIsListening(true);
        recognitionRef.current.onend = () => setIsListening(false);
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setDraft((prev) => (prev ? prev + " " + finalTranscript : finalTranscript));
          }
        };
      }
    }
    
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        alert("Your browser does not support voice input.");
        return;
      }
      recognitionRef.current.start();
    }
  };

  const speakMessage = (id: string, text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Your browser does not support text-to-speech.");
      return;
    }
    window.speechSynthesis.cancel();
    if (speakingMsgId === id) {
      setSpeakingMsgId(null);
      return;
    }
    const cleanText = text.replace(/[*_#]/g, "").replace(/\[.*?\]\(.*?\)/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(id);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loadingThread]);

  useEffect(() => {
    if (!suggestionsLoaded && messages.length === 0 && !activeId) {
      fetch("/api/chat/suggestions")
        .then((res) => res.json())
        .then((data) => {
          if (data.suggestions && data.suggestions.length > 0) {
            setAiSuggestions(data.suggestions.slice(0, 4));
          }
          setSuggestionsLoaded(true);
        })
        .catch(() => setSuggestionsLoaded(true));
    }
  }, [suggestionsLoaded, messages.length, activeId]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const cId = params.get("c");
      if (cId) {
        setTimeout(() => openConvo(cId), 0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshConvos = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = (await res.json()) as { conversations: ConversationVM[] };
        setConvos(data.conversations);
      }
    } catch {
      /* non-fatal */
    }
  }, []);

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

  function startTypewriter(aid: string) {
    let timer: ReturnType<typeof setInterval>;
    const tick = () => {
      const { buffer, done } = streamCtl.current;
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === aid);
        if (idx === -1) {
          clearInterval(timer);
          return prev;
        }
        const m = prev[idx];
        if (m.content.length < buffer.length) {
          const remaining = buffer.length - m.content.length;
          const step = Math.min(Math.max(Math.ceil(remaining / 5), 2), 16);
          const next = [...prev];
          next[idx] = { ...m, content: buffer.slice(0, m.content.length + step) };
          return next;
        }
        if (done) {
          clearInterval(timer);
          const next = [...prev];
          next[idx] = {
            ...m,
            pending: false,
            sources: done.sources ?? null,
            confidence: done.confidence ?? null,
            unknown: done.unknown,
            errorText: done.error,
          };
          setSending(false);
          return next;
        }
        return prev;
      });
    };
    timer = setInterval(tick, 24);
  }

  async function send(rawText?: string, overrideCategory?: string) {
    const content = (rawText ?? draft).trim();
    if (!content || sending) return;
    setDraft("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.focus();
    }
    setSending(true);

    const uid = `u-${Date.now()}`;
    const aid = `a-${Date.now()}`;
    setMessages((m) => [
      ...m,
      { id: uid, role: "user", content },
      { id: aid, role: "assistant", content: "", pending: true },
    ]);
    streamCtl.current = { buffer: "", done: null };
    startTypewriter(aid);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          conversationId: activeId ?? undefined,
          category: (overrideCategory ?? selectedCategory) || undefined,
        }),
      });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = acc.indexOf("\n")) >= 0) {
          const line = acc.slice(0, nl).trim();
          acc = acc.slice(nl + 1);
          if (!line) continue;
          const ev = JSON.parse(line) as {
            type: string;
            conversationId?: string;
            isNew?: boolean;
            text?: string;
            sources?: SourceRef[];
            confidence?: number;
            unknown?: boolean;
          };
          if (ev.type === "meta" && ev.conversationId) {
            if (ev.isNew) {
              setConvos((c) => [
                {
                  id: ev.conversationId!,
                  title: makeTitle(content),
                  updatedAt: new Date().toISOString(),
                  messageCount: 2,
                },
                ...c,
              ]);
            }
            setActiveId(ev.conversationId);
          } else if (ev.type === "delta" && ev.text) {
            streamCtl.current.buffer += ev.text;
          } else if (ev.type === "done") {
            streamCtl.current.done = {
              sources: ev.sources,
              confidence: ev.confidence,
              unknown: ev.unknown,
            };
          }
        }
      }
      // Safety: stream closed without a done event.
      if (!streamCtl.current.done) streamCtl.current.done = {};
      refreshConvos();
    } catch (err) {
      streamCtl.current.done = {
        error:
          err instanceof Error
            ? err.message
            : "Network error — please try again.",
      };
    }
  }

  function onComposerSubmit(e: FormEvent) {
    e.preventDefault();
    send();
  }

  function newChat() {
    if (sending) return;
    setActiveId(null);
    setMessages([]);
    setSidebarOpen(false);
    inputRef.current?.focus();
  }

  async function openConvo(id: string) {
    if (sending || id === activeId) {
      setSidebarOpen(false);
      return;
    }
    setSidebarOpen(false);
    setLoadingThread(true);
    setActiveId(id);
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setConvos((c) => c.filter((x) => x.id !== id));
          setActiveId(null);
          setMessages([]);
        }
        throw new Error("Could not load conversation.");
      }
      const data = (await res.json()) as {
        messages: {
          id: string;
          role: "user" | "assistant";
          content: string;
          sources: SourceRef[] | null;
          confidence: number | null;
          feedback?: 1 | -1 | null;
        }[];
      };
      setMessages(
        data.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          sources: m.sources,
          confidence: m.confidence,
          feedback: m.feedback,
          unknown:
            m.role === "assistant" &&
            m.content.startsWith("I searched the college knowledge base"),
        })),
      );
    } catch {
      /* toast-free, silent retry available by clicking again */
    } finally {
      setLoadingThread(false);
    }
  }

  async function deleteConvo(id: string) {
    setConvos((c) => c.filter((x) => x.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
    await fetch(`/api/conversations/${id}`, { method: "DELETE" }).catch(
      () => undefined,
    );
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await signOut(firebaseAuth);
    } catch {
      /* ignore */
    }
    router.replace("/login");
  };

  const activeTitle = activeId
    ? (convos.find((c) => c.id === activeId)?.title ?? "Conversation")
    : null;
  const firstName = user.name.split(" ")[0];

  /* --------------------------------- render --------------------------------- */

  const sidebar = (
    <div className="flex h-full w-72 flex-col border-r border-ink-800 bg-ink-900">
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-saffron-400 to-saffron-600 shadow-lg shadow-saffron-600/25">
          <GraduationCap className="h-5 w-5 text-ink-950" strokeWidth={2.4} />
        </span>
        <div className="min-w-0">
          <div className="font-display text-base leading-tight tracking-tight">
            College <span className="text-saffron-400 italic">ko</span> Jano
          </div>
          <div className="text-[10px] tracking-[0.14em] text-ink-500 uppercase">
            RAG campus assistant
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="ml-auto rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-800 hover:text-cream-100 lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      <div className="px-4">
        <button
          onClick={newChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-saffron-500/40 bg-saffron-500/10 py-2.5 text-sm font-medium text-saffron-300 transition hover:border-saffron-400/60 hover:bg-saffron-500/15"
        >
          <Plus className="h-4 w-4" />
          New chat
        </button>
        <Link
          href="/faqs"
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-ink-700 bg-ink-850 py-2 text-sm font-medium text-ink-300 transition hover:border-ink-600 hover:text-cream-100 hover:bg-ink-800"
        >
          <HelpCircle className="h-4 w-4" />
          View FAQs
        </Link>
      </div>

      <div className="scroll-slim mt-4 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {convos.length === 0 && (
          <p className="px-2 pt-6 text-center text-xs text-ink-500">
            No conversations yet.
            <br />
            Ask your first question.
          </p>
        )}
        <AnimatePresence initial={false}>
          {convos.map((c) => (
            <motion.div
              key={c.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: "hidden" }}
              transition={{ duration: 0.2 }}
              className={`group relative rounded-xl transition ${
              activeId === c.id
                ? "bg-ink-800 ring-1 ring-saffron-500/30"
                : "hover:bg-ink-850"
            }`}
          >
            <button
              onClick={() => openConvo(c.id)}
              className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left"
            >
              <MessageSquareText
                className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                  activeId === c.id ? "text-saffron-400" : "text-ink-500"
                }`}
              />
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-[13px] ${
                    activeId === c.id ? "text-cream-50" : "text-ink-200"
                  }`}
                >
                  {c.title}
                </span>
                <span className="text-[10px] text-ink-500">
                  {dayLabel(c.updatedAt)}
                </span>
              </span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteConvo(c.id);
              }}
              aria-label="Delete conversation"
              className="absolute top-2.5 right-2 rounded-md p-1 text-ink-500 opacity-0 transition group-hover:opacity-100 hover:bg-ink-700 hover:text-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
        </AnimatePresence>
      </div>

      <div className="border-t border-ink-800 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-ink-850 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-saffron-500/40 bg-saffron-500/15 font-display text-sm text-saffron-300">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            {isEditingName ? (
              <input
                autoFocus
                disabled={isSavingName}
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                className="w-full truncate rounded bg-ink-900 px-1.5 py-0.5 text-[13px] font-medium text-cream-100 outline-none ring-1 ring-saffron-500/50"
              />
            ) : (
              <div className="group/name flex items-center gap-1.5">
                <div className="truncate text-[13px] font-medium text-cream-100">
                  {user.name}
                </div>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-ink-500 opacity-0 transition group-hover/name:opacity-100 hover:text-saffron-400"
                  aria-label="Edit name"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[10px] text-ink-500 mt-0.5">
              <span className="truncate">{user.email}</span>
              {user.role === "admin" && (
                <span className="shrink-0 rounded-full bg-saffron-500/15 px-1.5 py-px text-[9px] font-semibold tracking-wide text-saffron-300 uppercase">
                  Admin
                </span>
              )}
            </div>
          </div>
          <button
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
            className="rounded-lg p-2 text-ink-400 transition hover:bg-ink-700 hover:text-rose-400"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh overflow-hidden bg-ink-950 text-cream-50">
      {/* desktop sidebar */}
      <div className="hidden shrink-0 lg:block">{sidebar}</div>

      {/* mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              {sidebar}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-ink-800 bg-ink-950/80 px-4 backdrop-blur">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-ink-300 transition hover:bg-ink-800 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-sm font-medium text-cream-100">
            {activeTitle ?? "New conversation"}
          </h1>
          
          {activeId && (
            <a
              href={`/api/conversations/${activeId}/export`}
              download
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center rounded-lg p-2 text-ink-300 transition hover:bg-ink-800 hover:text-saffron-300"
              title="Export conversation"
              aria-label="Export conversation"
            >
              <Download className="h-4.5 w-4.5" />
            </a>
          )}
          
          <ThemeToggle />

          {user.role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-full border border-saffron-500/40 bg-saffron-500/10 px-3 py-1.5 text-[11px] font-medium text-saffron-300 transition hover:border-saffron-400/60 hover:text-saffron-200"
            >
              <BookMarked className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Knowledge Studio</span>
              <span className="sm:hidden">Studio</span>
            </Link>
          )}
        </header>

        {/* messages */}
        <div ref={scrollRef} className="scroll-slim flex-1 overflow-y-auto">
          {messages.length === 0 && !loadingThread ? (
            <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-5 py-10 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-saffron-400 to-saffron-600 shadow-[0_18px_50px_-12px_rgba(255,122,26,0.55)]">
                  <GraduationCap className="h-8 w-8 text-ink-950" strokeWidth={2.2} />
                </span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                className="mt-6 font-display text-3xl tracking-tight"
              >
                Namaste, <span className="text-gradient italic">{firstName}</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                className="mt-3 max-w-md text-sm leading-relaxed text-ink-400"
              >
                Ask me anything about VVIT — I retrieve from{" "}
                <span className="text-saffron-300">{kb.docs} official documents</span>{" "}
                before I answer, and I always cite my sources.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                className="mt-8 grid w-full gap-2 sm:grid-cols-2"
              >
                {aiSuggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="group rounded-xl border border-ink-700 bg-ink-900/60 px-4 py-3 text-left text-[13px] text-ink-200 transition hover:border-saffron-500/40 hover:text-cream-50"
                  >
                    <span className="mr-1.5 text-saffron-400">→</span>
                    {s}
                  </button>
                ))}
              </motion.div>
            </div>
          ) : loadingThread ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-saffron-400" />
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-7 px-4 pt-8 pb-40 sm:px-6">
              <AnimatePresence initial={false}>
                {messages.map((m) =>
                  m.role === "user" ? (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
                      className="flex justify-end"
                      layout
                    >
                      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-saffron-400 to-saffron-600 px-4 py-3 text-sm font-medium whitespace-pre-wrap text-ink-950 shadow-lg shadow-saffron-600/15">
                        {m.content}
                      </div>
                    </motion.div>
                  ) : (
                    <AssistantMessage 
                      key={m.id} 
                      msg={m} 
                      speakMessage={speakMessage} 
                      speakingMsgId={speakingMsgId}
                      handleFeedback={(id, val) => setMessages(prev => prev.map(m => m.id === id ? {...m, feedback: val} : m))}
                    />
                  ),
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* composer */}
        <div className="shrink-0 border-t border-ink-800 bg-ink-950/90 px-4 py-3.5 backdrop-blur">
          {/* Category selector */}
          <div className="mx-auto max-w-3xl mb-3 flex flex-wrap gap-1.5 px-1">
            <button
              type="button"
              onClick={() => setSelectedCategory("")}
              className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                selectedCategory === ""
                  ? "bg-ink-700 text-cream-50"
                  : "bg-ink-800/50 text-ink-400 hover:bg-ink-800 hover:text-cream-100"
              }`}
            >
              All Departments
            </button>
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  // If chat is empty and nothing is typed, auto-query the category!
                  if (messages.length === 0 && !draft.trim()) {
                    send(`Tell me about the ${cat} department, including any fee structures, rules, or general information.`, cat);
                  }
                }}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                  selectedCategory === cat
                    ? "bg-saffron-500/20 text-saffron-300"
                    : "bg-ink-800/50 text-ink-400 hover:bg-ink-800 hover:text-cream-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <form
            onSubmit={onComposerSubmit}
            className="ring-field mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-ink-600 bg-ink-900 p-2 relative"
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              maxLength={2000}
              onChange={(e) => {
                setDraft(e.target.value);
                const el = e.target;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask about fees, hostels, placements, exams…"
              className="scroll-slim max-h-40 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-cream-50 outline-none placeholder:text-ink-500 pr-12"
            />
            {draft.length > 1400 && (
              <span className="self-center pr-1 text-[10px] text-ink-500">
                {draft.length}/2000
              </span>
            )}
            <button
              type="button"
              onClick={toggleListen}
              title="Voice Input"
              className={`absolute right-[52px] top-1.5 flex h-[38px] w-[38px] items-center justify-center rounded-xl transition ${
                isListening
                  ? "text-saffron-400 bg-saffron-400/20 animate-pulse"
                  : "text-ink-400 hover:text-cream-100 hover:bg-ink-800"
              }`}
            >
              {isListening ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-saffron-400 to-saffron-600 text-ink-950 shadow-lg shadow-saffron-600/25 transition hover:shadow-saffron-500/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <SendHorizontal className="h-4.5 w-4.5" strokeWidth={2.2} />
            </button>
          </form>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-ink-500">
            Answers are grounded in uploaded college documents · Enter to send,
            Shift+Enter for a new line
          </p>
        </div>
      </div>
    </div>
  );
}
