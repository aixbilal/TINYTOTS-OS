"use client";

import { useMemo, useState } from "react";
import {
  CAMPAIGN_THEME_PRESETS,
  DEFAULT_CAMPAIGN_THEME,
  buildCampaignThemeFromSeed,
  extractPaletteCore,
  type CampaignTheme,
} from "@/lib/signage-campaign";

const DETAIL_FIELDS: { key: keyof CampaignTheme; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "accent", label: "Accent" },
  { key: "button", label: "Button" },
  { key: "buttonText", label: "Button text" },
  { key: "badge", label: "Badge" },
  { key: "badgeText", label: "Badge text" },
  { key: "background", label: "Page background" },
  { key: "surface", label: "Hero surface" },
  { key: "card", label: "Card" },
  { key: "text", label: "Main text" },
  { key: "mutedText", label: "Muted text" },
  { key: "border", label: "Borders" },
  { key: "icon", label: "Icons" },
  { key: "footer", label: "Footer" },
  { key: "footerText", label: "Footer text" },
];

const QUICK_SEEDS = [
  { label: "Black", hex: "#1a1a1a" },
  { label: "Navy", hex: "#1b2a41" },
  { label: "Blue", hex: "#3d5a80" },
  { label: "Green", hex: "#5f7a55" },
  { label: "Brown", hex: "#9c422e" },
  { label: "Purple", hex: "#7a5ea7" },
  { label: "Rose", hex: "#b04a6a" },
  { label: "Teal", hex: "#2f6f6a" },
];

export default function CampaignPaletteEditor({
  theme,
  onChange,
}: {
  theme: CampaignTheme;
  onChange: (theme: CampaignTheme) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const seed = useMemo(() => extractPaletteCore(theme).brand, [theme]);

  function applySeed(hex: string) {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    onChange(buildCampaignThemeFromSeed(hex.toLowerCase()));
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        {CAMPAIGN_THEME_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange({ ...preset.theme })}
            className="flex items-center gap-2 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <span className="flex overflow-hidden rounded-full border border-black/10">
              <span className="h-3.5 w-3.5" style={{ background: preset.theme.primary }} />
              <span className="h-3.5 w-3.5" style={{ background: preset.theme.secondary }} />
              <span className="h-3.5 w-3.5" style={{ background: preset.theme.accent }} />
            </span>
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange({ ...DEFAULT_CAMPAIGN_THEME })}
          className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Reset palette
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Theme color of choice</p>
            <p className="text-xs text-gray-500">
              Pick one color — deep footer, soft backgrounds, buttons, badges, and borders generate
              automatically.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={seed}
              onChange={(event) => applySeed(event.target.value)}
              className="h-12 w-16 cursor-pointer rounded-md border border-gray-200 bg-transparent p-1"
              title="Select theme color"
            />
            <input
              value={seed}
              onChange={(event) => applySeed(event.target.value.trim())}
              className="w-28 rounded-md border border-gray-300 px-3 py-2 font-mono text-sm uppercase"
              spellCheck={false}
              maxLength={7}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_SEEDS.map((item) => (
            <button
              key={item.hex}
              type="button"
              onClick={() => applySeed(item.hex)}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
            >
              <span
                className="h-3 w-3 rounded-full border border-black/10"
                style={{ background: item.hex }}
              />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="overflow-hidden rounded-xl border border-gray-200"
        style={{ background: theme.background, color: theme.text }}
      >
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          style={{ background: theme.surface }}
        >
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: theme.mutedText }}
            >
              Live palette preview
            </p>
            <p className="text-sm font-semibold">Built from your one theme color</p>
          </div>
          <span
            className="rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase"
            style={{
              background: theme.badge,
              color: theme.badgeText,
              borderColor: theme.border,
            }}
          >
            Best Seller
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 px-4 py-4">
          <button
            type="button"
            className="rounded-md px-4 py-2 text-xs font-semibold"
            style={{ background: theme.button, color: theme.buttonText }}
          >
            Shop Collection
          </button>
          <span className="text-xs" style={{ color: theme.mutedText }}>
            Black → charcoal palette · Blue → blue palette · any color works
          </span>
          <span
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-full border"
            style={{
              borderColor: theme.border,
              color: theme.icon,
              background: theme.card,
            }}
          >
            ★
          </span>
        </div>
        <div
          className="flex items-center justify-between px-4 py-3 text-xs font-medium"
          style={{ background: theme.footer, color: theme.footerText }}
        >
          <span>www.tinytots.example</span>
          <span>Scan to Shop</span>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowDetails((open) => !open)}
          className="text-xs font-medium text-gray-700 underline-offset-2 hover:underline"
        >
          {showDetails ? "Hide fine-tune controls" : "Fine-tune individual colors"}
        </button>
        {showDetails && (
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {DETAIL_FIELDS.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2 rounded-md border border-gray-200 p-2"
              >
                <input
                  type="color"
                  value={theme[key]}
                  onChange={(event) => onChange({ ...theme, [key]: event.target.value })}
                  className="h-9 w-10 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                <span className="min-w-0">
                  <span className="block text-xs font-medium text-gray-700">{label}</span>
                  <span className="block truncate font-mono text-[10px] text-gray-500">
                    {theme[key]}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
