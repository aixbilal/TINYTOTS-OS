"use client";

import { useMemo, useState } from "react";

type BadgeOption = { id: number; label: string; is_active?: boolean };

export default function SignageBadgePicker({
  value,
  options,
  disabled,
  onChange,
  className = "",
}: {
  value: string | null | undefined;
  options: BadgeOption[];
  disabled?: boolean;
  onChange: (next: string | null) => void;
  className?: string;
}) {
  const current = value || "";
  const [query, setQuery] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState("");

  const activeOptions = useMemo(
    () => options.filter((item) => item.is_active !== false),
    [options]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activeOptions;
    return activeOptions.filter((item) => item.label.toLowerCase().includes(q));
  }, [activeOptions, query]);

  const inPool = activeOptions.some(
    (item) => item.label.toLowerCase() === current.toLowerCase()
  );

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex gap-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setCustomMode(false);
            onChange(null);
          }}
          className={`rounded px-2 py-1 text-[10px] ${
            !current ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          None
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setCustomMode(true);
            setCustomText(current && !inPool ? current : "");
          }}
          className={`rounded px-2 py-1 text-[10px] ${
            customMode || (current && !inPool)
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          Custom
        </button>
      </div>

      {customMode || (current && !inPool) ? (
        <div className="flex gap-1">
          <input
            value={customMode ? customText : current}
            disabled={disabled}
            onChange={(event) => {
              setCustomMode(true);
              setCustomText(event.target.value);
            }}
            onBlur={() => {
              const next = (customMode ? customText : current).trim();
              onChange(next || null);
            }}
            placeholder="Custom badge text"
            maxLength={40}
            className="w-full rounded border border-gray-200 px-1.5 py-1 text-[10px] text-gray-700"
          />
        </div>
      ) : (
        <>
          <input
            value={query}
            disabled={disabled}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search badges..."
            className="w-full rounded border border-gray-200 px-1.5 py-1 text-[10px] text-gray-700"
          />
          <select
            value={current}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value || null)}
            className="w-full rounded border border-gray-200 px-1.5 py-1 text-[10px] text-gray-700 bg-white"
            title="Signage card badge"
          >
            <option value="">No badge</option>
            {filtered.map((item) => (
              <option key={item.id} value={item.label}>
                {item.label}
              </option>
            ))}
            {current && !filtered.some((item) => item.label === current) && (
              <option value={current}>{current}</option>
            )}
          </select>
        </>
      )}
    </div>
  );
}
