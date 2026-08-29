"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  // Spring configurations for smoothness
  const springConfig = { damping: 28, stiffness: 400, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  const dotSpringConfig = { damping: 35, stiffness: 800 };
  const dotXSpring = useSpring(cursorX, dotSpringConfig);
  const dotYSpring = useSpring(cursorY, dotSpringConfig);

  const [isHovering, setIsHovering] = useState(false);
  const [isCoarse, setIsCoarse] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (window.matchMedia("(pointer: coarse)").matches) {
      return;
    }
    setIsCoarse(false);

    const updatePosition = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === "button" ||
        target.tagName.toLowerCase() === "a" ||
        target.closest("button") ||
        target.closest("a") ||
        window.getComputedStyle(target).cursor === "pointer"
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", updatePosition, { passive: true });
    window.addEventListener("mouseover", handleMouseOver, { passive: true });

    return () => {
      window.removeEventListener("mousemove", updatePosition);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [cursorX, cursorY]);

  if (!mounted || isCoarse) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        * {
          cursor: none !important;
        }
      ` }} />
      {/* Outer hollow circle */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full flex items-center justify-center -ml-[12px] -mt-[12px]"
        style={{
          x: cursorXSpring,
          y: cursorYSpring,
          background: isHovering 
            ? "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,122,26,0.15))"
            : "transparent",
          boxShadow: isHovering ? "none" : "inset 0 0 0 1.5px rgba(255,122,26,0.8)",
          backdropFilter: isHovering ? "invert(1) hue-rotate(180deg)" : "none",
          WebkitBackdropFilter: isHovering ? "invert(1) hue-rotate(180deg)" : "none",
        }}
        animate={{
          scale: isHovering ? 1.66 : 1, // 40 / 24 = 1.66
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 28,
        }}
      >
        <div className="w-[24px] h-[24px]" />
      </motion.div>
      {/* Inner dot */}
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[10000] rounded-full mix-blend-difference -ml-[2px] -mt-[2px]"
        style={{
          x: dotXSpring,
          y: dotYSpring,
          background: "linear-gradient(135deg, #ffffff, #FF7A1A)"
        }}
        animate={{
          opacity: isHovering ? 0 : 1,
          scale: isHovering ? 0 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 800,
          damping: 35,
        }}
      >
        <div className="w-[4px] h-[4px]" />
      </motion.div>
    </>
  );
}
