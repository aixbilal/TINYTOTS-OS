"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BUDGET_RANGES } from "@/lib/product-finder/config";
import { useCart } from "@/lib/cart-context";

type FinderResult = {
  id: number;
  name: string;
  category: string | null;
  gender: string | null;
  image_url: string | null;
  web_price: number | null;
  colors: string[];
  sizes: string[];
  url: string;
};

type ParseResponse =
  | { type: "products"; results: FinderResult[] }
  | { type: "help"; intent: { id: string; answer: string; link?: { href: string; label: string } } }
  | { type: "ai_unavailable" }
  | { type: "empty" };

const GENDER_CHOICES = [
  { value: "", label: "Any" },
  { value: "boy", label: "Boy" },
  { value: "girl", label: "Girl" },
];
const AGE_CHOICES = [
  { value: "", label: "Any age" },
  { value: "0-1", label: "0–1 yrs" },
  { value: "1-3", label: "1–3 yrs" },
  { value: "3-5", label: "3–5 yrs" },
  { value: "5-8", label: "5–8 yrs" },
  { value: "8-14", label: "8–14 yrs" },
];

function rs(n: number | null) {
  return n == null ? "" : `Rs. ${Math.round(n).toLocaleString("en-PK")}`;
}

export default function ProductFinder() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"guided" | "describe">("guided");
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = "product-finder-title";

  // ProductFinder is always mounted inside <CartProvider> (see SiteShell).
  const { cartBarVisible, totalItems } = useCart();
  const raisedForCart = cartBarVisible && totalItems > 0;

  // guided state
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [category, setCategory] = useState("");
  const [budgetIdx, setBudgetIdx] = useState<number | "">("");
  const [color, setColor] = useState("");
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);

  // describe state
  const [text, setText] = useState("");

  // shared result state
  type HelpAnswer = { answer: string; link?: { href: string; label: string } };
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FinderResult[] | null>(null);
  const [helpAnswer, setHelpAnswer] = useState<HelpAnswer | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!open || categories.length) return;
    fetch("/api/categories")
      .then((r) => r.json())
      .then((j) => setCategories(j.categories || []))
      .catch(() => setCategories([]));
  }, [open, categories.length]);

  // focus management + Esc close
  useEffect(() => {
    if (!open) return;
    const prevActive = document.activeElement as HTMLElement | null;
    const trigger = triggerRef.current;
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("button, [href], select, textarea, input")?.focus();
    }, 20);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      (prevActive ?? trigger)?.focus?.();
    };
  }, [open]);

  const resetResults = useCallback(() => {
    setResults(null);
    setHelpAnswer(null);
    setNotice(null);
  }, []);

  function startOver() {
    setGender(""); setAge(""); setCategory(""); setBudgetIdx(""); setColor(""); setText("");
    resetResults();
  }

  async function runGuided() {
    setLoading(true);
    resetResults();
    try {
      const budget = budgetIdx === "" ? undefined : { min: BUDGET_RANGES[budgetIdx].min, max: BUDGET_RANGES[budgetIdx].max };
      const res = await fetch("/api/product-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gender, ageBracket: age, category, budget, color }),
      });
      const j = await res.json();
      setResults(Array.isArray(j.results) ? j.results : []);
    } catch {
      setNotice("Something went wrong. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function runDescribe() {
    const q = text.trim();
    if (q.length < 2) return;
    setLoading(true);
    resetResults();
    try {
      const res = await fetch("/api/product-finder/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const j: ParseResponse = await res.json();
      if (j.type === "help") {
        setHelpAnswer({ answer: j.intent.answer, link: j.intent.link });
      } else if (j.type === "products") {
        setResults(j.results);
      } else if (j.type === "ai_unavailable") {
        setNotice("Smart search is busy right now. Try the guided finder instead.");
      } else {
        setNotice("Tell me what you're shopping for — like \"pink dress for a 3 year old\".");
      }
    } catch {
      setNotice("Smart search is busy right now. Try the guided finder instead.");
    } finally {
      setLoading(false);
    }
  }

  const resultsView = useMemo(() => {
    if (helpAnswer) {
      return (
        <div className="rounded-lg border border-border-default bg-surface-secondary p-3">
          <p className="font-body-sm text-body-sm text-text-primary">{helpAnswer.answer}</p>
          {helpAnswer.link && (
            <Link
              href={helpAnswer.link.href}
              onClick={() => setOpen(false)}
              className="mt-2 inline-block font-label-md text-label-md text-brand-primary hover:underline"
            >
              {helpAnswer.link.label} →
            </Link>
          )}
        </div>
      );
    }
    if (!results) return null;
    if (results.length === 0) {
      return (
        <p className="font-body-sm text-body-sm text-text-secondary">
          No matches for that combination. Try widening the budget or age range.
        </p>
      );
    }
    return (
      <div className="flex flex-col gap-2">
        <p className="font-label-md text-label-md text-text-secondary">Here are a few matches.</p>
        <ul className="flex flex-col gap-2">
          {results.map((p) => (
            <li key={p.id}>
              <Link
                href={p.url}
                onClick={() => setOpen(false)}
                className="flex gap-3 rounded-lg border border-border-default p-2 hover:border-brand-primary transition-colors"
              >
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image_url}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-md object-cover bg-surface-secondary"
                    loading="lazy"
                  />
                ) : (
                  <span className="h-16 w-16 shrink-0 rounded-md bg-surface-secondary" aria-hidden="true" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block font-body-sm text-body-sm text-text-primary truncate">{p.name}</span>
                  <span className="block font-label-md text-label-md text-text-secondary">
                    {rs(p.web_price)}
                    {p.sizes.length ? ` · ${p.sizes.slice(0, 4).join(", ")}` : ""}
                  </span>
                  {p.colors.length > 0 && (
                    <span className="block font-label-md text-label-md text-text-secondary/80 truncate">
                      {p.colors.slice(0, 4).join(", ")}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }, [helpAnswer, results]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={`fixed right-4 z-40 inline-flex items-center gap-2 rounded-full bg-brand-primary text-white shadow-lg px-4 py-3 font-button text-button hover:opacity-90 transition-opacity ${
          raisedForCart ? "bottom-28 md:bottom-24" : "bottom-4 md:bottom-6"
        }`}
      >
        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">auto_awesome</span>
        <span className="hidden sm:inline">Find something for me</span>
        <span className="sm:hidden">Find</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-surface-canvas border border-border-default p-4 sm:p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 id={titleId} className="font-headline-md text-headline-md text-text-primary">
                Find something for me
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="p-1.5 rounded-full text-text-secondary hover:bg-surface-secondary"
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
              </button>
            </div>

            <div className="flex gap-1 mb-4 rounded-lg bg-surface-secondary p-1 font-label-md text-label-md">
              {(["guided", "describe"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTab(t); resetResults(); }}
                  className={`flex-1 rounded-md px-3 py-1.5 transition-colors ${
                    tab === t ? "bg-surface-canvas text-text-primary shadow-sm" : "text-text-secondary"
                  }`}
                >
                  {t === "guided" ? "Guided" : "Describe it"}
                </button>
              ))}
            </div>

            {tab === "guided" && (
              <div className="flex flex-col gap-4">
                <Choice label="Who are you shopping for?" value={gender} onChange={setGender} options={GENDER_CHOICES} />
                <Choice label="Age" value={age} onChange={setAge} options={AGE_CHOICES} />
                <div>
                  <p className="font-label-md text-label-md text-text-secondary mb-1.5">What are you looking for?</p>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-border-default bg-surface-elevated px-3 py-2 font-body-sm text-body-sm"
                  >
                    <option value="">Anything</option>
                    {categories.map((c) => (
                      <option key={c.slug} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-text-secondary mb-1.5">Budget</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Pill active={budgetIdx === ""} onClick={() => setBudgetIdx("")}>Any</Pill>
                    {BUDGET_RANGES.map((b, i) => (
                      <Pill key={b.label} active={budgetIdx === i} onClick={() => setBudgetIdx(i)}>{b.label}</Pill>
                    ))}
                  </div>
                </div>
                <label className="font-label-md text-label-md text-text-secondary">
                  Colour <span className="text-text-secondary/60">(optional)</span>
                  <input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g. pink"
                    className="mt-1 w-full rounded-lg border border-border-default bg-surface-elevated px-3 py-2 font-body-sm text-body-sm"
                  />
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={runGuided}
                    disabled={loading}
                    className="flex-1 rounded-xl bg-brand-primary text-white font-button text-button py-2.5 hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? "Finding…" : "Show matches"}
                  </button>
                  {(results || helpAnswer) && (
                    <button
                      type="button"
                      onClick={startOver}
                      className="rounded-xl border border-border-default px-4 font-button text-button text-text-secondary hover:text-text-primary"
                    >
                      Start over
                    </button>
                  )}
                </div>
              </div>
            )}

            {tab === "describe" && (
              <div className="flex flex-col gap-3">
                <label className="font-label-md text-label-md text-text-secondary">
                  Describe what you need
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    maxLength={300}
                    placeholder='e.g. "something pink for my 5 year old daughter for a birthday under 4000"'
                    className="mt-1 w-full rounded-lg border border-border-default bg-surface-elevated px-3 py-2 font-body-sm text-body-sm"
                  />
                </label>
                <button
                  type="button"
                  onClick={runDescribe}
                  disabled={loading || text.trim().length < 2}
                  className="rounded-xl bg-brand-primary text-white font-button text-button py-2.5 hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Searching…" : "Search"}
                </button>
                <p className="font-label-md text-label-md text-text-secondary/70">
                  For order status, use{" "}
                  <Link href="/track-order" onClick={() => setOpen(false)} className="text-brand-primary hover:underline">
                    Track Order
                  </Link>
                  . Please avoid sharing phone numbers or emails here.
                </p>
              </div>
            )}

            {(notice || resultsView) && (
              <div className="mt-4 border-t border-border-default pt-4">
                {notice && <p className="font-body-sm text-body-sm text-text-secondary mb-2">{notice}</p>}
                {resultsView}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Choice({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <p className="font-label-md text-label-md text-text-secondary mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <Pill key={o.value} active={value === o.value} onClick={() => onChange(o.value)}>
            {o.label}
          </Pill>
        ))}
      </div>
    </div>
  );
}

function Pill({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 font-label-md text-label-md transition-colors ${
        active
          ? "border-brand-primary bg-brand-primary text-white"
          : "border-border-default text-text-secondary hover:border-brand-primary"
      }`}
    >
      {children}
    </button>
  );
}
