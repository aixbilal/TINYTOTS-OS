"use client";

import { useState, useRef, useEffect, useMemo, useId } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Adapted from https://www.vengenceui.com/components/gooey-search (MIT-style
// shadcn-registry component - framer-motion was already a project dependency,
// no new package added). Recolored from the original's generic
// var(--foreground)/var(--background) tokens to this project's brand-primary
// olive, since --foreground/--background aren't part of this design system.

function detectUnsupportedBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  const isSafari =
    ua.includes("safari") &&
    !ua.includes("chrome") &&
    !ua.includes("chromium") &&
    !ua.includes("android") &&
    !ua.includes("firefox");
  return isSafari || ua.includes("crios");
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const buttonMotionVariants = {
  step1: { x: 0, width: 100 },
  // No leftward x-shift on expand - the original component's -30 offset
  // assumed open space to its left, but this header sits in a fixed grid
  // column next to the logo, so it visually overlapped "TinyTots" instead
  // of expanding into empty space. Grows in place / rightward only now.
  step2: { x: 0, width: 200 },
};

const iconMotionVariants = {
  hidden: { x: -50, opacity: 0 },
  visible: { x: 16, opacity: 1 },
};

const getResultVariants = (index: number, unsupported: boolean) => ({
  initial: { y: 0, scale: 0.3, filter: unsupported ? "none" : "blur(10px)" },
  animate: { y: (index + 1) * 44, scale: 1, filter: "blur(0px)" },
  exit: { y: unsupported ? 0 : -4, scale: 0.8 },
});

const getResultTransition = (index: number) => ({
  duration: 0.75,
  delay: index * 0.12,
  type: "spring" as const,
  bounce: 0.35,
  filter: { ease: "easeInOut" },
});

function SearchSvgIcon({ isUnsupported }: { isUnsupported: boolean }) {
  return (
    <motion.svg
      initial={{ opacity: 0, scale: 0.8, x: -4, filter: isUnsupported ? "none" : "blur(5px)" }}
      animate={{ opacity: 1, scale: 1, x: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.8, x: -4, filter: isUnsupported ? "none" : "blur(5px)" }}
      transition={{ delay: 0.1, duration: 1, type: "spring", bounce: 0.15 }}
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
    >
      <path
        d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z"
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
      />
    </motion.svg>
  );
}

function LoadingSvgIcon() {
  const lines: [number, number, number, number][] = [
    [128, 32, 128, 64],
    [195.88, 60.12, 173.25, 82.75],
    [224, 128, 192, 128],
    [195.88, 195.88, 173.25, 173.25],
    [128, 224, 128, 192],
    [60.12, 195.88, 82.75, 173.25],
    [32, 128, 64, 128],
    [60.12, 60.12, 82.75, 82.75],
  ];
  return (
    <svg
      className="gooey-search-loading"
      viewBox="0 0 256 256"
      aria-label="Loading"
      role="status"
      style={{ width: 18, height: 18 }}
    >
      <rect width="256" height="256" fill="none" />
      {lines.map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeLinecap="round" strokeWidth={16} />
      ))}
    </svg>
  );
}

export interface GooeySearchItem {
  label: string;
  href: string;
}

export interface GooeySearchProps {
  items?: GooeySearchItem[];
  onSearch?: (query: string) => Promise<GooeySearchItem[]> | GooeySearchItem[];
  placeholder?: string;
  buttonLabel?: string;
  onSelect?: (item: GooeySearchItem) => void;
  className?: string;
  debounceMs?: number;
  maxResults?: number;
}

export function GooeySearch({
  items = [],
  onSearch,
  placeholder = "Search products...",
  buttonLabel = "Search",
  onSelect,
  className,
  debounceMs = 300,
  maxResults = 5,
}: GooeySearchProps) {
  const uid = useId().replace(/:/g, "_");
  const filterId = `gooey-search-${uid}`;

  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [searchText, setSearchText] = useState("");
  const [results, setResults] = useState<GooeySearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isUnsupported = useMemo(() => detectUnsupportedBrowser(), []);
  const debouncedQuery = useDebounce(searchText, debounceMs);

  useEffect(() => {
    if (step === 2) inputRef.current?.focus();
  }, [step]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!debouncedQuery) {
        setResults([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        let data: GooeySearchItem[];
        if (onSearch) {
          data = await onSearch(debouncedQuery);
        } else {
          data = items.filter((item) => item.label.toLowerCase().includes(debouncedQuery.trim().toLowerCase()));
        }
        if (!cancelled) setResults(data.slice(0, maxResults));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, items, onSearch, maxResults]);

  function close() {
    setStep(1);
    setSearchText("");
    setResults([]);
  }

  const btnPadding = isUnsupported ? "5px 10px" : "10px 20px";
  const resultPadding = isUnsupported ? "7.5px 10px" : "12.5px 20px";

  return (
    <div className={`relative inline-flex items-center justify-center ${className || ""}`}>
      <style>{`
        .gooey-search-loading { animation: gooeySearchSpin 0.5s linear infinite; transform-origin: center center; }
        @keyframes gooeySearchSpin { to { transform: rotate(180deg); } }
        .gooey-search-input::placeholder { color: #ffffff; opacity: 0.65; }
      `}</style>

      <svg aria-hidden="true" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -15" result="goo" />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div
        style={{
          filter: isUnsupported ? "none" : `url(#${filterId})`,
          cursor: "pointer",
          maxWidth: "max-content",
          position: "relative",
        }}
      >
        <AnimatePresence mode="popLayout">
          <motion.div
            key="results-wrapper"
            role="listbox"
            aria-label="Search results"
            style={{ position: "relative", zIndex: -1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ delay: isUnsupported ? 0.5 : 1.25, duration: 0.5 }}
          >
            <AnimatePresence mode="popLayout">
              {results.map((item, index) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  role="option"
                  tabIndex={0}
                  onClick={() => {
                    onSelect?.(item);
                    close();
                  }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  variants={getResultVariants(index, isUnsupported)}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={getResultTransition(index)}
                  style={{
                    backgroundColor: "#616845",
                    borderRadius: 40,
                    padding: resultPadding,
                    width: "100%",
                    color: "#ffffff",
                    position: "absolute",
                    left: 0,
                    fontSize: 14,
                    cursor: "pointer",
                    display: "block",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                  }}
                >
                  {item.label}
                </motion.a>
              ))}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        <motion.div
          variants={buttonMotionVariants}
          initial="step1"
          animate={step === 1 ? "step1" : "step2"}
          transition={{ duration: 0.75, type: "spring", bounce: 0.15 }}
          onClick={() => step === 1 && setStep(2)}
          whileHover={{ scale: step === 2 ? 1 : 1.05 }}
          whileTap={{ scale: 0.95 }}
          role={step === 1 ? "button" : undefined}
          aria-label={step === 1 ? "Open search" : undefined}
          style={{
            backgroundColor: "#616845",
            color: "#ffffff",
            cursor: "pointer",
            letterSpacing: -0.5,
            outline: "none",
            border: "none",
            borderRadius: 9999,
            padding: btnPadding,
          }}
        >
          {step === 1 ? (
            <span
              style={{
                pointerEvents: "none",
                textAlign: "center",
                position: "relative",
                left: 4,
                color: "#ffffff",
                opacity: 0.85,
                fontSize: 14,
                display: "block",
              }}
            >
              {buttonLabel}
            </span>
          ) : (
            <input
              ref={inputRef}
              type="text"
              className="gooey-search-input"
              placeholder={placeholder}
              aria-label="Search input"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && close()}
              style={{
                width: "100%",
                backgroundColor: "transparent",
                outline: "none",
                border: "none",
                color: "#ffffff",
                fontSize: 14,
              }}
            />
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 2 && (
            <motion.div
              key="icon-bubble"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={iconMotionVariants}
              transition={{ delay: 0.1, duration: 0.85, type: "spring", bounce: 0.15 }}
              onClick={close}
              style={{
                position: "absolute",
                backgroundColor: "#616845",
                width: isUnsupported ? 36 : 46,
                height: isUnsupported ? 36 : 46,
                right: -5,
                top: -1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: 9999,
                color: "#ffffff",
                cursor: "pointer",
              }}
              role="button"
              aria-label="Close search"
            >
              {isLoading ? <LoadingSvgIcon /> : <SearchSvgIcon isUnsupported={isUnsupported} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default GooeySearch;
