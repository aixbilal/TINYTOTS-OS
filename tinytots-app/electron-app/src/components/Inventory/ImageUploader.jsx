import { useState, useRef, useCallback } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const API_BASE = "http://localhost:3000";
const MAX_DIMENSION = 1600; // px — cuts upload size/time drastically vs. a raw phone/camera photo

async function getCroppedBlob(image, crop) {
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

export default function ImageUploader({ productId, images, onImagesChange }) {
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [deletingIds, setDeletingIds] = useState(new Set());

  const [queue, setQueue] = useState([]);
  const [cropSrc, setCropSrc] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const imgRef = useRef(null);
  const pendingFileRef = useRef(null);
  const fileInputRef = useRef(null);

  function processNext(remaining) {
    const [next, ...rest] = remaining;
    setQueue(rest);
    if (!next) {
      setCropSrc(null);
      return;
    }
    pendingFileRef.current = { name: next.name, type: next.type };
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result);
    reader.readAsDataURL(next);
  }

  function onSelectFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const valid = [];
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
      setQueue(valid);
      processNext(valid);
    }
    e.target.value = "";
  }

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    setCrop(centerCrop(makeAspectCrop({ unit: "%", width: 90 }, 1, width, height), width, height));
  }

  const uploadCroppedImage = useCallback(
    async (makePrimary) => {
      if (!imgRef.current || !completedCrop || !pendingFileRef.current) return;
      setUploading(true);
      setError(null);
      try {
        const blob = await getCroppedBlob(imgRef.current, completedCrop);
        const formData = new FormData();
        formData.append("file", blob, pendingFileRef.current.name);
        formData.append("is_primary", makePrimary ? "true" : "false");

        const res = await fetch(`${API_BASE}/api/products/${productId}/images`, {
          method: "POST",
          body: formData,
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
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
        processNext(queue);
      } catch {
        setError("Network error during upload. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [completedCrop, images, onImagesChange, productId, queue]
  );

  function skipCurrent() {
    pendingFileRef.current = null;
    setCompletedCrop(undefined);
    processNext(queue);
  }

  async function setPrimary(imageId) {
    setError(null);
    const res = await fetch(`${API_BASE}/api/products/${productId}/images`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_primary", image_id: imageId }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.error || "Failed to set primary image.");
      return;
    }
    onImagesChange(images.map((img) => ({ ...img, is_primary: img.id === imageId })));
  }

  async function deleteImage(imageId) {
    if (deletingIds.has(imageId)) return;
    setDeletingIds((prev) => new Set(prev).add(imageId));
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/products/${productId}/images?image_id=${imageId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {images
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((img) => (
            <div
              key={img.id}
              className="relative w-24 h-24 rounded-lg overflow-hidden border-2 group"
              style={{ borderColor: img.is_primary ? "#7A2E2E" : "transparent" }}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              {img.is_primary && (
                <span className="absolute top-1 left-1 bg-maroon-700 text-cream-50 text-[9px] px-1.5 py-0.5 rounded">
                  Primary
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                {!img.is_primary && (
                  <button
                    type="button"
                    onClick={() => setPrimary(img.id)}
                    className="text-white text-[10px] bg-white/20 rounded px-1.5 py-1 hover:bg-white/30"
                  >
                    Primary
                  </button>
                )}
                <button
                  type="button"
                  disabled={deletingIds.has(img.id)}
                  onClick={() => deleteImage(img.id)}
                  className="text-white text-[10px] bg-red-600/80 rounded px-1.5 py-1 hover:bg-red-600 disabled:opacity-50"
                >
                  {deletingIds.has(img.id) ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-24 h-24 rounded-lg border-2 border-dashed border-gold-300/50 flex items-center justify-center text-xs text-ink-700 hover:border-maroon-700 hover:text-maroon-700 transition text-center px-2"
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

      {error && <p className="text-sm text-maroon-700">{error}</p>}

      {cropSrc && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-cream-50 rounded-xl p-4 max-w-lg w-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-ink-900">Crop image</h3>
              {queue.length > 0 && (
                <span className="text-xs text-ink-700/70">{queue.length} more queued</span>
              )}
            </div>
            <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompletedCrop(c)} aspect={1}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <img ref={imgRef} src={cropSrc} onLoad={onImageLoad} alt="Crop preview" className="max-h-[50vh]" />
            </ReactCrop>
            <div className="flex justify-between gap-2">
              <button
                type="button"
                onClick={skipCurrent}
                className="px-4 py-2 rounded-lg border border-gold-300/50 text-sm text-ink-900"
              >
                {queue.length > 0 ? "Skip" : "Cancel"}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => uploadCroppedImage(false)}
                  className="px-4 py-2 rounded-lg border border-gold-300/50 text-sm text-ink-900 disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Add as gallery image"}
                </button>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => uploadCroppedImage(true)}
                  className="px-4 py-2 rounded-lg bg-maroon-700 text-cream-50 text-sm disabled:opacity-50"
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