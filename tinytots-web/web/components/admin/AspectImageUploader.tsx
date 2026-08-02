"use client";

import { useEffect, useRef, useState } from "react";
import ReactCrop, { centerCrop, makeAspectCrop, type PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { adminFetch } from "@/lib/admin-fetch";

async function createCroppedBlob(
  image: HTMLImageElement,
  crop: PercentCrop,
  outputWidth: number,
  outputHeight: number
): Promise<Blob> {
  const sourceX = image.naturalWidth * (crop.x / 100);
  const sourceY = image.naturalHeight * (crop.y / 100);
  const sourceWidth = image.naturalWidth * (crop.width / 100);
  const sourceHeight = image.naturalHeight * (crop.height / 100);
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not prepare the cropped image.");
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    outputWidth,
    outputHeight
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not generate the cropped image."))),
      "image/jpeg",
      0.9
    );
  });
}

function initialAspectCrop(aspect: number, width: number, height: number) {
  return centerCrop(makeAspectCrop({ unit: "%", width: 92 }, aspect, width, height), width, height);
}

/**
 * Campaign-style upload + aspect crop, parameterized for homepage hero
 * (and reusable elsewhere). Uploads the cropped JPEG to /api/admin/homepage/upload
 * and returns the public URL via onChange — does not touch campaign/product/blog routes.
 */
export default function AspectImageUploader({
  label,
  value,
  onChange,
  aspect,
  aspectLabel,
  previewClassName,
  outputWidth,
  outputHeight,
  variant,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  aspect: number;
  aspectLabel: string;
  previewClassName: string;
  outputWidth: number;
  outputHeight: number;
  variant: "desktop" | "mobile";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [crop, setCrop] = useState<PercentCrop>();
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
    setCrop(undefined);
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
      setError("Image must be under 10MB.");
      return;
    }
    setError("");
    if (source?.startsWith("blob:")) URL.revokeObjectURL(source);
    setSource(URL.createObjectURL(file));
    setCrop(undefined);
  }

  function onImageLoad(event: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = event.currentTarget;
    if (!crop || crop.width <= 0 || crop.height <= 0 || Math.abs(crop.width / crop.height - aspect) > 0.2) {
      setCrop(initialAspectCrop(aspect, width, height));
    }
  }

  async function saveCrop() {
    if (!imageRef.current || !crop) return;
    setSaving(true);
    setError("");
    try {
      const blob = await createCroppedBlob(imageRef.current, crop, outputWidth, outputHeight);
      const formData = new FormData();
      formData.append("file", blob, `hero-${variant}.jpg`);
      formData.append("variant", variant);

      const response = await adminFetch("/api/admin/homepage/upload", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "Upload failed.");
      if (!payload.url) throw new Error("Upload returned no URL.");
      onChange(payload.url);
      closeEditor();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className={`${previewClassName} w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100`}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full min-h-[80px] place-items-center text-sm text-gray-400">
            No {aspectLabel} image
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white"
        >
          {value ? "Replace image" : "Upload & crop"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={saving}
            className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700"
          >
            Clear
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={chooseFile}
        className="hidden"
      />
      <p className="text-xs text-gray-500">Cropped to {aspectLabel} before upload.</p>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {source && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="flex max-h-[95vh] w-full max-w-5xl flex-col gap-4 overflow-y-auto rounded-xl bg-white p-5">
            <div>
              <h3 className="font-semibold text-gray-900">Crop to {aspectLabel}</h3>
              <p className="text-xs text-gray-500">
                Frame the composition for the homepage hero ({label.toLowerCase()}).
              </p>
            </div>
            <div className="overflow-auto bg-gray-100 p-2">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                aspect={aspect}
                keepSelection
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imageRef}
                  src={source}
                  onLoad={onImageLoad}
                  alt={`${label} crop`}
                  className="max-h-[55vh] max-w-full"
                />
              </ReactCrop>
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
                {saving ? "Uploading..." : "Apply crop & upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
