"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenText,
  CircleCheck,
  DatabaseZap,
  FolderUp,
  GraduationCap,
  Hash,
  MessagesSquare,
  ScanSearch,
  ScanText,
  Scissors,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import HeroChat from "@/components/landing/hero-chat";
import ThemeToggle from "@/components/theme-toggle";

type PublicUser = { name: string; email: string; role: string } | null;

/* --------------------------------- helpers -------------------------------- */

/**
 * Ultra-smooth reveal: uses GPU-accelerated `will-change: transform` and
 * a fast spring transition for instant-feeling scroll reveals.
 */
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 1, 0.5, 1], // fast ease-out quint
      }}
      style={{ willChange: "transform, opacity" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 flex items-center gap-2 text-xs font-medium tracking-[0.22em] text-saffron-400 uppercase">
      <span className="h-px w-8 bg-saffron-500/60" />
      {children}
    </p>
  );
}

const TOPICS = [
  "Admissions",
  "Fee Structure",
  "Scholarships",
  "Placements",
  "Hostel Life",
  "Library",
  "Exams & CGPA",
  "Academic Calendar",
  "Clubs & Fests",
  "Campus Policies",
  "Events",
  "Internships",
];

const PIPELINE = [
  {
    icon: FolderUp,
    title: "Documents uploaded",
    desc: "Admins drop in PDFs, notices and FAQs through the Knowledge Studio.",
  },
  {
    icon: ScanText,
    title: "Text extraction",
    desc: "Clean text is pulled from every PDF and document automatically.",
  },
  {
    icon: Scissors,
    title: "Smart chunking",
    desc: "Content is split into overlapping passages that keep context intact.",
  },
  {
    icon: Hash,
    title: "Vector embeddings",
    desc: "Each chunk becomes a 1024-dimensional TF-IDF vector.",
  },
  {
    icon: DatabaseZap,
    title: "Postgres vector search",
    desc: "Cosine similarity ranks passages against your question in-database.",
  },
  {
    icon: Sparkles,
    title: "Grounded answer",
    desc: "Top passages synthesize a fluent reply — always with cited sources.",
  },
];

const FEATURES = [
  {
    icon: ScanSearch,
    title: "RAG-grounded answers",
    desc: "Every reply is synthesized from retrieved document chunks — never from model memory.",
    span: "lg:col-span-4",
    tallTest: true,
  },
  {
    icon: ShieldAlert,
    title: "Knows its limits",
    desc: "A dual confidence gate (vector score + term coverage) honestly declines questions the knowledge base can't support.",
    span: "lg:col-span-2",
  },
  {
    icon: BookOpenText,
    title: "Cited sources",
    desc: "Each answer carries the exact documents and match scores it was built from.",
    span: "lg:col-span-2",
  },
  {
    icon: MessagesSquare,
    title: "Conversation memory",
    desc: "Full chat history in a sidebar — pick any thread back up where you left it.",
    span: "lg:col-span-2",
  },
  {
    icon: DatabaseZap,
    title: "Knowledge Studio",
    desc: "Admins upload, re-index and retire documents; the corpus re-embeds itself automatically.",
    span: "lg:col-span-2",
  },
];

/* Container-level spring config for consistent buttery physics */
const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };

/* --------------------------------- sections ------------------------------- */

function Nav({ user }: { user: PublicUser }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-ink-700/70 bg-ink-950/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-saffron-400 to-saffron-600 shadow-lg shadow-saffron-600/30">
            <GraduationCap className="h-4.5 w-4.5 text-ink-950" strokeWidth={2.4} />
          </span>
          <span className="font-display text-lg tracking-tight">
            College <span className="text-saffron-400 italic">ko</span> Jano
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-ink-300 md:flex">
          <a href="#pipeline" className="transition hover:text-cream-50">
            Pipeline
          </a>
          <a href="#features" className="transition hover:text-cream-50">
            Features
          </a>
          <a href="#answers" className="transition hover:text-cream-50">
            See it answer
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <Link
              href="/chat"
              className="group inline-flex items-center gap-1.5 rounded-full bg-cream-50 px-4 py-2 text-sm font-semibold text-ink-950 transition hover:bg-saffron-300"
            >
              Open chat
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm text-ink-300 transition hover:text-cream-50 sm:block"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="group inline-flex items-center gap-1.5 rounded-full bg-cream-50 px-4 py-2 text-sm font-semibold text-ink-950 transition hover:bg-saffron-300"
              >
                Get started
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}

function Hero({ user, docs }: { user: PublicUser; docs: number }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, -80]);
  const springY = useSpring(y, springConfig);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const springOpacity = useSpring(opacity, springConfig);

  return (
    <section className="grain relative overflow-hidden pt-16">
      {/* ambient background */}
      <div
        aria-hidden
        className="absolute -top-40 right-[-15%] h-[560px] w-[560px] rounded-full bg-saffron-600/16 blur-[140px]"
      />
      <div
        aria-hidden
        className="absolute bottom-[-30%] left-[-10%] h-[520px] w-[520px] rounded-full bg-saffron-700/10 blur-[150px]"
      />
      <div
        aria-hidden
        className="absolute top-24 left-[6%] hidden font-hindi text-[180px] leading-none text-ink-800/50 select-none lg:block"
      >
        ज्ञान
      </div>

      <motion.div
        style={{ y: springY, opacity: springOpacity }}
        className="relative mx-auto grid max-w-7xl gap-16 px-5 pt-14 pb-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-24 lg:pb-28"
      >
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900/70 px-3.5 py-1.5 text-xs text-ink-300 backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-saffron-400" />
            RAG · Retrieval-Augmented Generation
            <span className="text-ink-600">|</span>
            <span className="text-saffron-300">{docs} live documents</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05, ease: [0.25, 1, 0.5, 1] }}
            className="font-display text-[13.5vw] leading-[0.95] tracking-tight text-balance sm:text-7xl lg:text-[5.4rem]"
          >
            College ko
            <br />
            <span className="text-gradient italic">Jano</span>
            <span className="ml-3 align-top font-hindi text-[0.45em] text-saffron-300/80">
              जानो
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
            className="mt-7 max-w-xl text-lg leading-relaxed text-ink-300"
          >
            The campus assistant that answers from your college&apos;s{" "}
            <em className="font-display text-cream-100 not-italic underline decoration-saffron-500/50 decoration-2 underline-offset-4">
              actual documents
            </em>{" "}
            — admissions, fees, hostels, placements — with vector-verified
            sources, never guesswork.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15, ease: [0.25, 1, 0.5, 1] }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link
              href={user ? "/chat" : "/signup"}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-saffron-400 to-saffron-600 px-7 py-3.5 text-sm font-semibold text-ink-950 shadow-[0_18px_50px_-12px_rgba(255,122,26,0.55)] transition hover:shadow-[0_22px_60px_-10px_rgba(255,122,26,0.7)]"
            >
              Start asking
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#pipeline"
              className="inline-flex items-center gap-2 rounded-full border border-ink-600 px-7 py-3.5 text-sm font-medium text-cream-100 transition hover:border-saffron-500/50 hover:text-saffron-300"
            >
              How the RAG works
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 flex items-center gap-3 text-xs text-ink-400"
          >
            <CircleCheck className="h-4 w-4 text-leaf-400" />
            Answers include sources
            <span className="text-ink-600">·</span>
            <ShieldAlert className="h-4 w-4 text-saffron-400" />
            Says &ldquo;I don&rsquo;t know&rdquo; when it doesn&rsquo;t
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 1, 0.5, 1] }}
          className="animate-float"
        >
          <HeroChat />
        </motion.div>
      </motion.div>
    </section>
  );
}

function Marquee() {
  const row = [...TOPICS, ...TOPICS];
  return (
    <div className="relative border-y border-ink-700/80 bg-ink-900/60 py-5">
      <div className="mask-fade-x overflow-hidden">
        <div className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap">
          {row.map((t, i) => (
            <span
              key={i}
              className="flex items-center gap-10 font-display text-2xl text-ink-300"
            >
              {t}
              <span className="text-sm text-saffron-500">✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Pipeline() {
  return (
    <section id="pipeline" className="grain relative overflow-hidden mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-36">
      <Reveal>
        <Kicker>The pipeline</Kicker>
        <h2 className="max-w-2xl font-display text-4xl leading-tight tracking-tight sm:text-5xl">
          Your question&rsquo;s journey through{" "}
          <span className="text-gradient italic">the vector space</span>
        </h2>
        <p className="mt-5 max-w-xl text-ink-300">
          A real retrieval-augmented generation pipeline — no shortcuts. This is
          exactly what runs when you press send.
        </p>
      </Reveal>

      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PIPELINE.map((step, i) => (
          <Reveal key={step.title} delay={i * 0.06}>
            <motion.div
              whileHover={{ y: -4, transition: { type: "spring", ...springConfig } }}
              className="group relative h-full overflow-hidden rounded-2xl border border-ink-700 bg-ink-900/60 p-7 transition-colors duration-200 hover:border-saffron-500/40"
            >
              <div
                aria-hidden
                className="absolute -top-10 -right-6 font-display text-[7rem] leading-none text-ink-800/70 transition-colors duration-200 group-hover:text-saffron-600/15"
              >
                {i + 1}
              </div>
              <div className="relative">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-saffron-500/30 bg-saffron-500/10 text-saffron-400">
                  <step.icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h3 className="mt-5 font-display text-xl text-cream-50">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-400">
                  {step.desc}
                </p>
              </div>
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-saffron-500/50 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              />
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="grain relative overflow-hidden border-t border-ink-800 bg-ink-900/40">
      <div className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-36">
        <Reveal>
          <Kicker>Built like a product</Kicker>
          <h2 className="max-w-2xl font-display text-4xl leading-tight tracking-tight sm:text-5xl">
            Everything a campus assistant{" "}
            <span className="text-gradient italic">should do</span>
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-5 lg:grid-cols-6">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.05} className={f.span}>
              <motion.div
                whileHover={{ y: -4, transition: { type: "spring", ...springConfig } }}
                className="group relative h-full overflow-hidden rounded-2xl border border-ink-700 bg-gradient-to-b from-ink-850 to-ink-900 p-7 transition-colors duration-200 hover:border-saffron-500/40"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-saffron-500/30 bg-saffron-500/10 text-saffron-400">
                  <f.icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h3 className="mt-5 font-display text-xl text-cream-50">
                  {f.title}
                </h3>
                <p className="mt-2.5 max-w-md text-sm leading-relaxed text-ink-400">
                  {f.desc}
                </p>
                {f.tallTest && (
                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    {["question", "embed", "search", "rerank", "answer"].map(
                      (s, j) => (
                        <span key={s} className="flex items-center gap-2">
                          <span className="rounded-full border border-ink-600 bg-ink-900 px-3 py-1 text-[11px] text-ink-300">
                            {s}
                          </span>
                          {j < 4 && (
                            <ArrowRight className="h-3 w-3 text-saffron-500" />
                          )}
                        </span>
                      ),
                    )}
                  </div>
                )}
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Showcase({ user }: { user: PublicUser }) {
  return (
    <section id="answers" className="grain relative overflow-hidden mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-36">
      <div className="relative grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <Reveal>
            <Kicker>See it answer</Kicker>
            <h2 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
              Straight answers,{" "}
              <span className="text-gradient italic">receipts attached</span>
            </h2>
            <p className="mt-5 max-w-md text-ink-300">
              These are real answers from the actual knowledge base — the same
              documents you&rsquo;ll query when you sign in. Notice what happens
              when the answer <em>isn&rsquo;t</em> in the corpus.
            </p>
            <Link
              href={user ? "/chat" : "/signup"}
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-cream-50 px-6 py-3 text-sm font-semibold text-ink-950 transition hover:bg-saffron-300"
            >
              Try it live
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>

        <div className="space-y-6">
          {/* grounded answer example */}
          <Reveal delay={0.05}>
            <div className="rounded-3xl border border-ink-700 bg-ink-900/70 p-6 sm:p-8">
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-saffron-400 to-saffron-600 px-4 py-3 text-sm font-medium text-ink-950">
                  What is the hostel fee for a single AC room?
                </div>
              </div>
              <div className="mt-5 rounded-2xl rounded-bl-md border border-ink-700 bg-ink-850 p-5">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-saffron-300 uppercase">
                  <Sparkles className="h-3 w-3" />
                  College Ko Jano
                  <span className="ml-auto rounded-full border border-leaf-400/30 bg-leaf-400/10 px-2 py-0.5 text-[10px] tracking-normal text-leaf-400 normal-case">
                    high confidence
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-cream-100/90">
                  Single-occupancy AC hostel rooms cost{" "}
                  <strong className="text-cream-50">₹1,10,000 per year</strong>.
                  Double sharing (non-AC) is ₹75,000/year and triple sharing is
                  ₹55,000/year. Mess charges of ₹42,000/year are compulsory for
                  all hostel residents, plus a refundable ₹5,000 hostel security
                  deposit.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-700/70 pt-3.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-saffron-500/30 bg-saffron-500/10 px-2.5 py-1 text-[11px] text-saffron-300">
                    <BookOpenText className="h-3 w-3" />
                    Hostel &amp; Accommodation Guide · 78%
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-600 bg-ink-900 px-2.5 py-1 text-[11px] text-ink-300">
                    <BookOpenText className="h-3 w-3" />
                    Fee Structure 2025-26 · 71%
                  </span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* unknown example */}
          <Reveal delay={0.1}>
            <div className="rounded-3xl border border-dashed border-ink-600 bg-ink-900/40 p-6 sm:p-8">
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-ink-700 px-4 py-3 text-sm font-medium text-cream-100">
                  Who won the cricket world cup?
                </div>
              </div>
              <div className="mt-5 rounded-2xl rounded-bl-md border border-dashed border-saffron-500/40 bg-ink-850/60 p-5">
                <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-saffron-300 uppercase">
                  <TriangleAlert className="h-3 w-3" />
                  Not in the knowledge base
                </div>
                <p className="text-sm leading-relaxed text-ink-300">
                  I searched the college knowledge base but couldn&rsquo;t find
                  reliable information about that. I only answer from officially
                  uploaded documents — so I won&rsquo;t guess. Try asking about
                  fees, hostels, placements or exams instead.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Stats({
  stats,
}: {
  stats: { docs: number; chunks: number; topics: number };
}) {
  const items = [
    { value: String(stats.docs), label: "knowledge documents" },
    { value: String(stats.chunks), label: "embedded vector chunks" },
    { value: String(stats.topics), label: "campus topics covered" },
    { value: "100%", label: "answers with sources" },
  ];
  return (
    <section className="border-y border-ink-700/80 bg-gradient-to-b from-ink-900 to-ink-950">
      <div className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <Reveal key={it.label} delay={i * 0.05}>
            <div
              className={`px-6 py-12 text-center sm:px-8 ${
                i > 0 ? "border-l border-ink-800" : ""
              }`}
            >
              <div className="font-display text-4xl text-saffron-400 sm:text-5xl">
                {it.value}
              </div>
              <div className="mt-2 text-xs tracking-[0.16em] text-ink-400 uppercase">
                {it.label}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Cta({ user }: { user: PublicUser }) {
  return (
    <section className="grain relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 mx-auto h-[420px] max-w-3xl rounded-full bg-saffron-600/14 blur-[130px]"
      />
      <div className="relative mx-auto max-w-7xl px-5 py-28 text-center sm:px-8 lg:py-40">
        <Reveal>
          <p className="font-hindi text-xl text-saffron-300/80">
            अपने कॉलेज को जानो
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl font-display text-5xl leading-[1.02] tracking-tight text-balance sm:text-7xl">
            Stop searching.
            <br />
            <span className="text-gradient italic">Start asking.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-md text-ink-300">
            Create a free student account and ask your first question in under a
            minute.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href={user ? "/chat" : "/signup"}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-saffron-400 to-saffron-600 px-8 py-4 text-sm font-semibold text-ink-950 shadow-[0_18px_50px_-12px_rgba(255,122,26,0.55)] transition hover:shadow-[0_22px_60px_-10px_rgba(255,122,26,0.7)]"
            >
              {user ? "Open the assistant" : "Create free account"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink-800 bg-ink-950">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-saffron-400 to-saffron-600">
                <GraduationCap className="h-4.5 w-4.5 text-ink-950" strokeWidth={2.4} />
              </span>
              <div className="font-display text-base tracking-tight">
                College <span className="text-saffron-400 italic">ko</span> Jano
              </div>
            </div>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-ink-400">
              The campus assistant that answers from your college's actual documents with vector-verified sources.
            </p>
            <div className="mt-6 flex items-center gap-4">
              <a href={process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com"} target="_blank" rel="noreferrer" className="text-ink-400 hover:text-cream-50 transition">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.02c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A4.37 4.37 0 0 0 9 18.13V22"></path></svg>
              </a>
              <a href={process.env.NEXT_PUBLIC_LINKEDIN_URL || "https://linkedin.com"} target="_blank" rel="noreferrer" className="text-ink-400 hover:text-cream-50 transition">
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-cream-50">Product</h3>
            <ul className="mt-6 space-y-4 text-sm text-ink-400">
              <li><a href="#pipeline" className="hover:text-saffron-400 transition">Pipeline</a></li>
              <li><a href="#features" className="hover:text-saffron-400 transition">Features</a></li>
              <li><a href="#answers" className="hover:text-saffron-400 transition">See answers</a></li>
              <li><a href="#about" className="hover:text-saffron-400 transition">About us</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-cream-50">Legal</h3>
            <ul className="mt-6 space-y-4 text-sm text-ink-400">
              <li><a href="#" className="hover:text-saffron-400 transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-saffron-400 transition">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-ink-800 pt-8 md:flex-row">
          <p className="text-xs text-ink-500">© {new Date().getFullYear()} College Ko Jano. All rights reserved.</p>
          <p className="font-hindi text-sm text-ink-500">
            ज्ञानं परमं बलम् — knowledge is supreme strength
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ---------------------------------- root ---------------------------------- */

export default function Landing({
  user,
  stats,
}: {
  user: PublicUser;
  stats: { docs: number; chunks: number; topics: number };
}) {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-ink-950 text-cream-50">
      <Nav user={user} />
      <Hero user={user} docs={stats.docs} />
      <Marquee />
      <Pipeline />
      <Features />
      <Showcase user={user} />
      <Stats stats={stats} />
      <Cta user={user} />
      <Footer />
    </main>
  );
}
