"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap } from "lucide-react";

export default function GlobalLoader({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Prevent scrolling while loading
    document.body.style.overflow = "hidden";

    const duration = 2000; // 2 seconds total loading time
    const intervalTime = duration / 100; // time per 1%

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 1;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setLoading(false);
            document.body.style.overflow = "";
          }, 300); // Wait a tiny bit at 100%
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => {
      clearInterval(timer);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {loading && (
          <motion.div
            key="global-loader"
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-ink-950 text-cream-50"
            // The loader expands into a massive circle revealing the app beneath
            exit={{ 
              clipPath: "circle(150% at 50% 50%)", 
              opacity: 0,
              transition: { duration: 1.2, ease: [0.76, 0, 0.24, 1] } 
            }}
            initial={{ clipPath: "circle(100% at 50% 50%)", opacity: 1 }}
          >
            {/* ambient glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-saffron-600/15 blur-[120px]" />
            
            <motion.div 
              className="relative z-10 flex flex-col items-center"
              exit={{ scale: 2, opacity: 0, transition: { duration: 0.8, ease: "easeIn" } }}
            >
              {/* Logo animation */}
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 0.85, opacity: 1 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="mb-6"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-saffron-400 to-saffron-600 shadow-[0_0_60px_-15px_rgba(255,122,26,0.5)]">
                  <GraduationCap className="h-8 w-8 text-ink-950" strokeWidth={2} />
                </span>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-center"
              >
                <h1 className="font-display text-2xl tracking-tight sm:text-3xl">
                  College <span className="text-gradient italic">ko</span> Jano
                </h1>
                <p className="mt-1.5 font-hindi text-saffron-400/80 tracking-widest text-[11px]">
                  कॉलेज को जानो
                </p>
              </motion.div>

              {/* Progress Bar Container */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-10 flex w-56 flex-col items-center gap-2.5"
              >
                <div className="flex w-full items-center justify-between px-1 text-xs font-medium tracking-widest text-ink-400 uppercase">
                  <span>Loading</span>
                  <span className="text-saffron-400">{progress}%</span>
                </div>
                
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-900 shadow-inner">
                  <motion.div
                    className="h-full bg-gradient-to-r from-saffron-500 to-saffron-400"
                    style={{ width: `${progress}%` }}
                    layout
                  />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The main application, which moves backward and scales up when loading is done */}
      <motion.div
        animate={
          loading 
            ? { scale: 0.85, opacity: 0, filter: "blur(12px)" } 
            : { scale: 1, opacity: 1, filter: "blur(0px)" }
        }
        transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </>
  );
}
