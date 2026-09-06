// src/components/motion/FlipText.jsx
import { useEffect, useState } from "react";

/**
 * A short supporting line that flips to the next phrase every `interval` ms —
 * adapted from the Vengeance UI "Flip Text" grammar into the TinyTots system.
 *
 * Restraint rules (owner §13): one slow character flip per change, elegant, no
 * infinite chaotic motion. `prefers-reduced-motion` is honoured automatically —
 * `index.css` collapses the keyframe to ~1ms, so phrases simply swap.
 */
export default function FlipText({ phrases, interval = 3800, className = "" }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (phrases.length < 2) return undefined;
    const id = setInterval(
      () => setIndex((v) => (v + 1) % phrases.length),
      interval
    );
    return () => clearInterval(id);
  }, [phrases.length, interval]);

  const phrase = phrases[index] ?? "";

  return (
    <span className={`tt-flip-line inline-block ${className}`} aria-live="polite">
      {/* key on index → the char spans remount so the flip replays each change */}
      <span key={index} className="inline-block">
        {Array.from(phrase).map((ch, i) => (
          <span
            key={i}
            className="tt-flip-char"
            style={{ animationDelay: `${i * 22}ms` }}
          >
            {ch === " " ? " " : ch}
          </span>
        ))}
      </span>
    </span>
  );
}
