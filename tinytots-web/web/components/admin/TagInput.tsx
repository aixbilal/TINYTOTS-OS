"use client";

import { useState } from "react";

export default function TagInput({
  label, placeholder, values, onChange,
}: { label: string; placeholder: string; values: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");

  function commit() {
    const cleaned = draft.trim();
    if (cleaned && !values.includes(cleaned)) onChange([...values, cleaned]);
    setDraft("");
  }

  return (
    <div>
      <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1.5 p-2 border border-outline-variant/50 rounded-lg min-h-[42px] bg-surface-container-lowest">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 bg-surface-container-low text-on-surface font-body-sm text-body-sm px-2 py-1 rounded-full">
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} className="text-on-surface-variant hover:text-error">
              ✕
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(); } }}
          onBlur={commit}
          placeholder={values.length ? "" : placeholder}
          className="flex-1 min-w-[80px] font-body-sm text-body-sm bg-transparent outline-none"
        />
      </div>
      <p className="font-label-md text-label-md text-on-surface-variant/60 mt-1">Press Enter or comma to add</p>
    </div>
  );
}