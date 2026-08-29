"use client";

import { useCallback } from "react";
import { Lightbulb } from "lucide-react";

/**
 * Bulb theme switch — flips html.light / html.dark and persists the choice.
 * The bulb's lit/dim appearance is pure CSS (see globals.css .theme-toggle),
 * so there is never a hydration mismatch or icon flash.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const toggle = useCallback(() => {
    const el = document.documentElement;

    // Briefly enable the full-app color transition, then clean up.
    el.classList.add("theme-anim");
    window.setTimeout(() => el.classList.remove("theme-anim"), 450);

    const isLight = el.classList.toggle("light");
    el.classList.toggle("dark", !isLight);
    try {
      localStorage.setItem("ckj-theme", isLight ? "light" : "dark");
    } catch {
      /* private mode etc. — theme still applies for this session */
    }
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch between light and dark mode"
      title="Switch theme"
      className={`theme-toggle ${className}`}
    >
      <Lightbulb strokeWidth={2} />
    </button>
  );
}
