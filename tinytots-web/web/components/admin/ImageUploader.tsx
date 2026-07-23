"use client";

import { useState, useRef, useCallback } from "react";
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { adminFetch } from "@/lib/admin-fetch";

type ProductImage = {
  id: number;
  storage_path: string;
  is_primary: boolean;
  sort_order: number;
  url: string;
  variant_ids?: number[];
};

type VariantOption = { id: number; color: string | null; size: string | null };

const MAX_DIMENSION = 1600; // px — plenty for a product photo, cuts upload size/time drastically

// Reads the cropped area of an <img> onto a canvas, downscales if needed,
// and returns a Blob. Downscaling is the main fix for slow uploads — a
// phone photo can be 4000px+ wide, which takes far longer to upload than
// the product card will ever actually display.
async function getCroppedBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const cropWidthPx = crop.width * scaleX;
  const cropHeightPx = crop.height * scaleY;

  const scale = Math.min(1, MAX_DIMENSION / Math.max(cropWidthPx, cropHeightPx));
  const outputWidth = Math.round(cropWidthPx * scale);
  const outputHeight = Math.round(cropHeightPx * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    cropWidthPx,
    cropHeightPx,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Crop failed"));
    }, "image/jpeg", 0.85);
  });
}

export default function ImageUploader({
  productId,
  images,
  onImagesChange,
  variants = [],
}: {
  productId: string | number;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  variants?: VariantOption[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  // Queue of files picked in one go — crop them one at a time
  const [queue, setQueue] = useState<File[]>([]);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [selectedVariantIds, setSelectedVariantIds] = useState<number[]>([]);
  const imgRef = useRef<HTMLImageElement>(null);
  const pendingFileRef = useRef<{ name: string; type: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function startQueue(files: File[]) {
    setQueue(files);
    processNext(files);
  }

  function processNext(remaining: File[]) {
    const [next, ...rest] = remaining;
    setQueue(rest);
    if (!next) {
      setCropSrc(null);
      return;
    }
    pendingFileRef.current = { name: next.name, type: next.type };
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(next);
  }

  function onSelectFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const valid: File[] = [];
    for (const file of files) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError(`${file.name}: only JPEG, PNG, or WebP images are allowed.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name}: must be under 5MB.`);
        continue;
      }
      valid.push(file);
    }
    if (valid.length) {
      setError(null);
      setSelectedVariantIds([]);
      startQueue(valid);
    }
    e.target.value = ""; // allow re-selecting the same file(s) later
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: "%", width: 90 }, 1, width, height),
      width,
      height
    );
    setCrop(initialCrop);
  }

  const uploadCroppedImage = useCallback(
    async (makePrimary: boolean) => {
      if (!imgRef.current || !completedCrop || !pendingFileRef.current) return;
      setUploading(true);
      setError(null);
      try {
        const blob = await getCroppedBlob(imgRef.current, completedCrop);
        const formData = new FormData();
        formData.append("file", blob, pendingFileRef.current.name);
        formData.append("is_primary", makePrimary ? "true" : "false");
        if (selectedVariantIds.length > 0) {
          formData.append("variant_ids", selectedVariantIds.join(","));
        }

        const res = await adminFetch(`/api/admin/products/${productId}/images`, {
          method: "POST",
          body: formData,
        });
        const json = await res.json();

        if (!res.ok) {
          setError(json.error || "Upload failed.");
          setUploading(false);
          return;
        }

        const updated = makePrimary
          ? [...images.map((img) => ({ ...img, is_primary: false })), json.data]
          : [...images, json.data];
        onImagesChange(updated);

        pendingFileRef.current = null;
        setCompletedCrop(undefined);
        setSelectedVariantIds([]);

        // Move to the next file in the queue, if any (multi-select flow)
        processNext(queue);
      } catch {
        setError("Network error during upload. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [completedCrop, images, onImagesChange, productId, queue, selectedVariantIds]
  );

  function skipCurrent() {
    pendingFileRef.current = null;
    setCompletedCrop(undefined);
    setSelectedVariantIds([]);
    processNext(queue);
  }

  async function setPrimary(imageId: number) {
    setError(null);
    const res = await adminFetch(`/api/admin/products/${productId}/images`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_primary", image_id: imageId }),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error || "Failed to set primary image.");
      return;
    }
    onImagesChange(
      images.map((img) => ({ ...img, is_primary: img.id === imageId }))
    );
  }

  async function deleteImage(imageId: number) {
    // Guard against double-clicks / double-fires: if a delete for this
    // image is already in flight, ignore further clicks entirely.
    if (deletingIds.has(imageId)) return;

    setDeletingIds((prev) => new Set(prev).add(imageId));
    setError(null);
    try {
      const res = await adminFetch(
        `/api/admin/products/${productId}/images?image_id=${imageId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Failed to delete image.");
        return;
      }
      const remaining = images.filter((img) => img.id !== imageId);
      const wasPrimary = images.find((img) => img.id === imageId)?.is_primary;
      if (wasPrimary && remaining.length > 0) {
        remaining[0] = { ...remaining[0], is_primary: true };
      }
      onImagesChange(remaining);
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(imageId);
        return next;
      });
    }
  }

  function variantLabel(v: VariantOption) {
    return [v.color, v.size].filter(Boolean).join(" / ") || `Variant ${v.id}`;
  }

  function toggleVariant(id: number) {
    setSelectedVariantIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {images
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((img) => (
            <div
              key={img.id}
              className="relative w-28 h-28 rounded-lg overflow-hidden border-2 group"
              style={{ borderColor: img.is_primary ? "#9c422e" : "transparent" }}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              {img.is_primary && (
                <span className="absolute top-1 left-1 bg-[#9c422e] text-white text-[10px] px-1.5 py-0.5 rounded">
                  Primary
                </span>
              )}
              {!!img.variant_ids?.length && (
                <span className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded truncate">
                  {img.variant_ids.length} variant{img.variant_ids.length > 1 ? "s" : ""}
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                {!img.is_primary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(img.id)}
                    className="text-white text-xs bg-white/20 rounded px-2 py-1 hover:bg-white/30"
                  >
                    Make primary
                  </button>
                )}
                <button
                  type="button"
                  disabled={deletingIds.has(img.id)}
                  onClick={() => deleteImage(img.id)}
                  className="text-white text-xs bg-red-600/80 rounded px-2 py-1 hover:bg-red-600 disabled:opacity-50"
                >
                  {deletingIds.has(img.id) ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-28 h-28 rounded-lg border-2 border-dashed border-outline-variant flex items-center justify-center text-sm text-on-surface-variant hover:border-primary hover:text-primary transition text-center px-2"
        >
          + Add photos
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={onSelectFiles}
          className="hidden"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {cropSrc && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 max-w-lg w-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Crop image</h3>
              {queue.length > 0 && (
                <span className="text-xs text-on-surface-variant">{queue.length} more queued</span>
              )}
            </div>
            <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompletedCrop(c)} aspect={1}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={imgRef} src={cropSrc} onLoad={onImageLoad} alt="Crop preview" className="max-h-[50vh]" />
            </ReactCrop>

            {variants.length > 0 && (
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">
                  Show this photo for specific variants (optional — leave blank to show for all)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => toggleVariant(v.id)}
                      className={`text-xs px-2 py-1 rounded-full border ${
                        selectedVariantIds.includes(v.id)
                          ? "bg-[#9c422e] text-white border-[#9c422e]"
                          : "border-outline-variant text-on-surface-variant"
                      }`}
                    >
                      {variantLabel(v)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between gap-2">
              <button
                type="button"
                onClick={skipCurrent}
                className="px-4 py-2 rounded-lg border border-outline-variant text-sm"
              >
                {queue.length > 0 ? "Skip" : "Cancel"}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => uploadCroppedImage(false)}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-sm disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Add as gallery image"}
                </button>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => uploadCroppedImage(true)}
                  className="px-4 py-2 rounded-lg bg-[#9c422e] text-white text-sm disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Set as primary"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}