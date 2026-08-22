"use client";

export default function JumpToSectionSelect({ sections }: { sections: { id: string; title: string }[] }) {
  return (
    <select
      onChange={(e) => document.getElementById(e.target.value)?.scrollIntoView({ behavior: "smooth", block: "start" })}
      className="w-full border border-border-default rounded-lg px-3 py-2.5 font-body-sm text-body-sm text-text-primary bg-white"
      defaultValue=""
    >
      <option value="" disabled>Jump to a section...</option>
      {sections.map((s) => (
        <option key={s.id} value={s.id}>{s.title}</option>
      ))}
    </select>
  );
}
