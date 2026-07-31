"use client";

import { useRef, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";

export default function CampaignQrEditor({
  campaignId,
  imageUrl,
  onUpdated,
}: {
  campaignId: number;
  imageUrl: string | null;
  onUpdated: (campaign: Record<string, unknown>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await adminFetch(`/api/admin/campaigns/${campaignId}/qr-upload`, {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "QR upload failed.");
      onUpdated(payload.campaign);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "QR upload failed.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    setError("");
    try {
      const response = await adminFetch(`/api/admin/campaigns/${campaignId}/qr-upload`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "QR deletion failed.");
      onUpdated(payload.campaign);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "QR deletion failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-md border border-gray-200 bg-white">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="Campaign QR code" className="h-full w-full object-contain" />
        ) : (
          <span className="material-symbols-outlined text-3xl text-gray-300">qr_code_2</span>
        )}
      </div>
      <div className="flex flex-col items-start gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => inputRef.current?.click()}
            className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : imageUrl ? "Replace QR" : "Upload QR"}
          </button>
          {imageUrl && (
            <button
              type="button"
              disabled={saving}
              onClick={remove}
              className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 disabled:opacity-50"
            >
              Delete
            </button>
          )}
        </div>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={upload}
        className="hidden"
      />
    </div>
  );
}
