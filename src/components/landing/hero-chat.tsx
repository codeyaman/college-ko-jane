"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpenText, GraduationCap, Search, Sparkles } from "lucide-react";

const SCRIPT = [
  {
    q: "What is the B.Tech fee per semester?",
    a: "The B.Tech tuition fee is ₹95,000 per semester, plus a ₹2,500 exam fee. First-year students also pay a one-time ₹15,000 admission fee and a refundable ₹10,000 caution deposit.",
    source: "Fee Structure 2025-26",
    match: 83,
  },
  {
    q: "When do hostel allotments open?",
    a: "Hostel allotment for freshers opens on the ERP on 20 July 2025, first-come first-served. Triple sharing is ₹55,000/year, double ₹75,000, and single AC rooms ₹1,10,000.",
    source: "Hostel & Accommodation Guide",
    match: 77,
  },
  {
    q: "What was the highest placement package?",
    a: "For the 2024-25 batch, the highest package was ₹52 LPA, the average was ₹7.8 LPA, and 87% of eligible students were placed across 142 recruiting companies.",
    source: "Placements & Career Cell",
    match: 81,
  },
];

export default function HeroChat() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SCRIPT.length), 5200);
    return () => clearInterval(id);
  }, []);

  const item = SCRIPT[index];

  return (
    <div className="relative">
      {/* orbiting ring ornament */}
      <div
        aria-hidden
        className="absolute -inset-8 animate-spin-slower rounded-full border border-dashed border-ink-600/60"
      />
      <div
        aria-hidden
        className="absolute -inset-8 animate-spin-slower rounded-full"
      >
        <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-saffron-400 shadow-[0_0_18px_4px_rgba(255,154,61,0.55)]" />
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-ink-700 bg-ink-900/80 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-ink-700/80 px-5 py-3.5">
          <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink-600" />
          <span className="h-2.5 w-2.5 rounded-full bg-saffron-500/70" />
          <span className="ml-3 flex items-center gap-1.5 text-xs text-ink-300">
            <GraduationCap className="h-3.5 w-3.5 text-saffron-400" />
            college-ko-jano
            <span className="text-ink-500">·</span>
            <span className="flex items-center gap-1 text-leaf-400">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-leaf-400" />
              live RAG
            </span>
          </span>
        </div>

        <div className="min-h-[340px] px-5 py-5 sm:min-h-[360px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              {/* question */}
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-saffron-400 to-saffron-600 px-4 py-3 text-sm font-medium text-ink-950 shadow-lg shadow-saffron-600/20">
                  {item.q}
                </div>
              </div>

              {/* retrieval strip */}
              <div className="flex items-center gap-2 text-[11px] text-ink-400">
                <Search className="h-3 w-3 text-saffron-400" />
                searched {38} embedded chunks
                <span className="text-ink-600">·</span>
                0.4s
              </div>

              {/* answer */}
              <div className="rounded-2xl rounded-bl-md border border-ink-700 bg-ink-850 px-4 py-3.5">
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-saffron-300 uppercase">
                  <Sparkles className="h-3 w-3" />
                  College Ko Jano
                </div>
                <p className="text-sm leading-relaxed text-cream-100/90">
                  {item.a}
                </p>
                {/* source */}
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-700/70 pt-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-saffron-500/30 bg-saffron-500/10 px-2.5 py-1 text-[11px] text-saffron-300">
                    <BookOpenText className="h-3 w-3" />
                    {item.source}
                  </span>
                  <span className="text-[11px] text-ink-400">
                    vector match {item.match}%
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* progress dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {SCRIPT.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Show example ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-6 bg-saffron-400" : "w-1.5 bg-ink-600"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
