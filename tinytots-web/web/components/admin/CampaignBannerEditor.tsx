"use client";

import { useEffect, useRef, useState } from "react";
import ReactCrop, { centerCrop, makeAspectCrop, type PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { adminFetch } from "@/lib/admin-fetch";
import {
  DEFAULT_BANNER_FOCAL_POINT,
  type BannerCrop,
  type BannerFocalPoint,
} from "@/lib/signage-campaign";

const BANNER_ASPECT = 11 / 4;
const PREVIEW_WIDTH = 2200;
const PREVIEW_HEIGHT = 800;

async function createPreview(image: HTMLImageElement, crop: PercentCrop): Promise<Blob> {
  const sourceX = image.naturalWidth * (crop.x / 100);
  const sourceY = image.naturalHeight * (crop.y / 100);
  const sourceWidth = image.naturalWidth * (crop.width / 100);
  const sourceHeight = image.naturalHeight * (crop.height / 100);
  const canvas = document.createElement("canvas");
  canvas.width = PREVIEW_WIDTH;
  canvas.height = PREVIEW_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare the banner preview.");
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    PREVIEW_WIDTH,
    PREVIEW_HEIGHT
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not generate the banner preview."))),
      "image/jpeg",
      0.9
    );
  });
}

function initialAspectCrop(width: number, height: number) {
  return centerCrop(makeAspectCrop({ unit: "%", width: 92 }, BANNER_ASPECT, width, height), width, height);
}

export default function CampaignBannerEditor({
  campaignId,
  originalUrl,
  previewUrl,
  savedCrop,
  savedFocalPoint,
  onUpdated,
}: {
  campaignId: number;
  originalUrl: string | null;
  previewUrl: string | null;
  savedCrop: BannerCrop;
  savedFocalPoint: BannerFocalPoint;
  onUpdated: (campaign: Record<string, unknown>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [crop, setCrop] = useState<PercentCrop>();
  const [focalPoint, setFocalPoint] = useState(savedFocalPoint || DEFAULT_BANNER_FOCAL_POINT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(
    () => () => {
      if (source?.startsWith("blob:")) URL.revokeObjectURL(source);
    },
    [source]
  );

  function closeEditor() {
    if (source?.startsWith("blob:")) URL.revokeObjectURL(source);
    setSource(null);
    setOriginalFile(null);
  }

  function chooseFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, or WebP images are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Original banner must be under 10MB.");
      return;
    }
    setError("");
    if (source?.startsWith("blob:")) URL.revokeObjectURL(source);
    setOriginalFile(file);
    setSource(URL.createObjectURL(file));
    setCrop(undefined);
    setFocalPoint(DEFAULT_BANNER_FOCAL_POINT);
  }

  function editExisting() {
    if (!originalUrl) return;
    setError("");
    setOriginalFile(null);
    setSource(originalUrl);
    setCrop(savedCrop?.width && savedCrop?.height ? savedCrop : undefined);
    setFocalPoint(savedFocalPoint || DEFAULT_BANNER_FOCAL_POINT);
  }

  function onImageLoad(event: React.SyntheticEvent<HTMLImageElement>) {
    if (!crop || crop.width <= 0 || crop.height <= 0 || Math.abs(crop.width / crop.height - BANNER_ASPECT) > 0.2) {
      setCrop(initialAspectCrop(event.currentTarget.width, event.currentTarget.height));
    }
  }

  async function saveCrop() {
    if (!imageRef.current || !crop) return;
    setSaving(true);
    setError("");
    try {
      const previewBlob = await createPreview(imageRef.current, crop);
      const formData = new FormData();
      if (originalFile) formData.append("file", originalFile);
      formData.append("preview", previewBlob, "banner-preview.jpg");
      formData.append("crop", JSON.stringify({ ...crop, unit: "%" }));
      formData.append("focal_point", JSON.stringify(focalPoint));

      const response = await adminFetch(`/api/admin/campaigns/${campaignId}/upload`, {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Banner upload failed.");
      onUpdated(payload.campaign);
      closeEditor();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Banner upload failed.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBanner() {
    if (!window.confirm("Delete this campaign banner and its stored original and preview?")) return;
    setSaving(true);
    setError("");
    try {
      const response = await adminFetch(`/api/admin/campaigns/${campaignId}/upload`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Banner deletion failed.");
      onUpdated(payload.campaign);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Banner deletion failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-[11/4] w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Current campaign banner"
            className="h-full w-full object-cover"
            style={{ objectPosition: `${savedFocalPoint.x}% ${savedFocalPoint.y}%` }}
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-gray-400">No banner artwork uploaded</div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          {originalUrl ? "Upload replacement" : "Upload original artwork"}
        </button>
        {originalUrl && (
          <>
            <button
              type="button"
              onClick={editExisting}
              disabled={saving}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700"
            >
              Re-edit original crop
            </button>
            <button
              type="button"
              onClick={deleteBanner}
              disabled={saving}
              className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700"
            >
              Delete banner
            </button>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={chooseFile}
        className="hidden"
      />
      <p className="text-xs text-gray-500">
        Original is preserved. The signage uses a separate 11:4 preview with saved crop and focal-point metadata.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {source && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="flex max-h-[95vh] w-full max-w-5xl flex-col gap-4 overflow-y-auto rounded-xl bg-white p-5">
            <div>
              <h3 className="font-semibold text-gray-900">Crop campaign artwork to 11:4</h3>
              <p className="text-xs text-gray-500">
                Keep the child, product and background composition inside the crop. Marketing copy remains HTML.
              </p>
            </div>
            <div className="overflow-auto bg-gray-100 p-2">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                aspect={BANNER_ASPECT}
                keepSelection
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imageRef}
                  src={source}
                  crossOrigin="anonymous"
                  onLoad={onImageLoad}
                  alt="Original banner crop"
                  className="max-h-[55vh] max-w-full"
                />
              </ReactCrop>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-xs font-medium text-gray-600">
                Horizontal focal point: {Math.round(focalPoint.x)}%
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={focalPoint.x}
                  onChange={(event) => setFocalPoint({ ...focalPoint, x: Number(event.target.value) })}
                  className="mt-1 w-full"
                />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Vertical focal point: {Math.round(focalPoint.y)}%
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={focalPoint.y}
                  onChange={(event) => setFocalPoint({ ...focalPoint, y: Number(event.target.value) })}
                  className="mt-1 w-full"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || !crop}
                onClick={saveCrop}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save original, crop and preview"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
