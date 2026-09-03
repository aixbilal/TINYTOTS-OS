"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import AspectImageUploader from "@/components/admin/AspectImageUploader";
import {
  AdminPageHeader,
  AdminCard,
  AdminAlert,
  AdminField,
  AdminSaveBar,
  AdminSubnav,
  adminInputClass,
} from "@/components/admin/ui";
import { SUBNAV } from "@/lib/admin-nav";

interface HelpContent {
  hero_image_url: string;
  hero_image_url_mobile: string;
  hero_eyebrow: string;
  hero_headline: string;
  hero_subtext: string;
  support_image_url: string;
}

const EMPTY: HelpContent = {
  hero_image_url: "",
  hero_image_url_mobile: "",
  hero_eyebrow: "",
  hero_headline: "",
  hero_subtext: "",
  support_image_url: "",
};

function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <AdminField label={label}>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={adminInputClass}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={adminInputClass}
        />
      )}
    </AdminField>
  );
}

export default function HelpContentAdminPage() {
  const [content, setContent] = useState<HelpContent>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminFetch("/api/admin/help-content");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load");
        setContent({ ...EMPTY, ...json.content });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load help page content.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function updateField<K extends keyof HelpContent>(field: K, value: HelpContent[K]) {
    setContent((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/help-content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      setContent({ ...EMPTY, ...json.content });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <AdminPageHeader
        breadcrumb={["Content", "Help Center"]}
        title="Help Center page settings"
        description={
          "The hero banner and “Need More Help” visual on /help. Page-level content, separate from individual articles (managed under Help Center → Articles)."
        }
      />

      <AdminSubnav items={SUBNAV.help} />

      {error && (
        <div className="mb-4">
          <AdminAlert tone="danger">{error}</AdminAlert>
        </div>
      )}

      {loading ? (
        <p className="font-body-sm text-body-sm text-text-secondary">Loading…</p>
      ) : (
        <div className="space-y-6">
          <AdminCard title="Hero banner">
            <div className="flex flex-col gap-5">
              <AspectImageUploader
                label="Desktop hero image"
                value={content.hero_image_url || ""}
                onChange={(v) => updateField("hero_image_url", v)}
                aspect={16 / 9}
                aspectLabel="16:9"
                previewClassName="aspect-[16/9]"
                outputWidth={1920}
                outputHeight={1080}
                variant="desktop"
              />
              <AspectImageUploader
                label="Mobile hero image (optional - falls back to desktop crop if empty)"
                value={content.hero_image_url_mobile || ""}
                onChange={(v) => updateField("hero_image_url_mobile", v)}
                aspect={4 / 5}
                aspectLabel="4:5"
                previewClassName="aspect-[4/5]"
                outputWidth={1080}
                outputHeight={1350}
                variant="mobile"
              />
              <TextField
                label="Eyebrow"
                value={content.hero_eyebrow}
                onChange={(v) => updateField("hero_eyebrow", v)}
                placeholder="Help Center"
              />
              <TextField
                label="Headline"
                value={content.hero_headline}
                onChange={(v) => updateField("hero_headline", v)}
                placeholder="How can we help you?"
              />
              <TextField
                label="Subtext"
                value={content.hero_subtext}
                onChange={(v) => updateField("hero_subtext", v)}
                multiline
                placeholder="Find answers to common questions or get in touch with our team."
              />
            </div>
          </AdminCard>

          <AdminCard title={"“Need More Help” visual"}>
            <div className="flex flex-col gap-5">
              <p className="font-label-md text-label-md text-text-secondary">
                Image shown beside the Popular Help Topics list. Heading/copy for this section are
                fixed site copy, not admin-editable.
              </p>
              <AspectImageUploader
                label="Support image"
                value={content.support_image_url || ""}
                onChange={(v) => updateField("support_image_url", v)}
                aspect={4 / 3}
                aspectLabel="4:3"
                previewClassName="aspect-[4/3] max-w-sm"
                outputWidth={1000}
                outputHeight={750}
                variant="desktop"
              />
              <AdminSaveBar onSave={save} saving={saving} saved={saved} />
            </div>
          </AdminCard>
        </div>
      )}
    </div>
  );
}
