"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { publicUrl, UPLOAD_LIMITS, type Bucket } from "@/lib/storage";
import { removeFromBucket, uploadToBucket } from "@/lib/upload";
import { cn, errorMessage } from "@/lib/utils";

/**
 * Single-image upload control with preview, progress and removal. Stores the
 * bucket-qualified path in the parent's state; the parent decides when to
 * persist it.
 */
export function ImageUploadField({
  label,
  hint,
  bucket,
  value,
  onChange,
  shape = "square",
  altName,
  maxEdge,
  className,
}: {
  label: string;
  hint?: string;
  bucket: Bucket;
  value: string | null;
  onChange: (path: string | null) => void;
  shape?: "square" | "wide";
  /** Name used for alt text on the preview. */
  altName?: string;
  maxEdge?: number;
  className?: string;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const src = publicUrl(value);
  const limits = UPLOAD_LIMITS[bucket];

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setProgress(5);
    try {
      const previous = value;
      const res = await uploadToBucket(bucket, file, { maxEdge, onProgress: setProgress });
      onChange(res.path);
      if (previous) void removeFromBucket(previous);
    } catch (e) {
      setError(errorMessage(e, "Upload failed. Please try again."));
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove() {
    const previous = value;
    onChange(null);
    if (previous) void removeFromBucket(previous);
  }

  return (
    <div className={className}>
      <span className="label" id={`${id}-label`}>
        {label}
      </span>
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-dashed transition",
          dragging ? "border-gold-400 bg-gold-400/10" : "border-white/15 bg-navy-950/40",
          shape === "square" ? "aspect-square max-w-[16rem]" : "aspect-[21/9] w-full",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFile(e.dataTransfer.files?.[0]);
        }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={altName ? `${label} of ${altName}` : label} className="h-full w-full object-cover" />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={progress !== null}
            aria-labelledby={`${id}-label`}
            className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-ivory-400 hover:text-ivory-100"
          >
            {progress !== null ? <Spinner /> : <ImagePlus size={28} className="text-gold-400" aria-hidden />}
            <span className="text-sm">{progress !== null ? "Uploading…" : "Click or drop an image"}</span>
            <span className="text-[11px] text-ivory-500">JPG, PNG or WebP · up to {Math.round(limits.maxBytes / 1024 / 1024)} MB</span>
          </button>
        )}
        {progress !== null && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
            <div className="h-full bg-gold-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={limits.mimes.join(",")}
        className="sr-only"
        onChange={(e) => void handleFile(e.target.files?.[0])}
        aria-labelledby={`${id}-label`}
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {src && (
          <>
            <button type="button" className="btn-secondary px-4 py-1.5 text-xs" onClick={() => inputRef.current?.click()} disabled={progress !== null}>
              <UploadCloud size={14} /> Replace
            </button>
            <button type="button" className="btn-ghost px-3 py-1.5 text-xs text-danger-400" onClick={remove} disabled={progress !== null} aria-label={`Remove ${label.toLowerCase()}`}>
              <Trash2 size={14} /> Remove
            </button>
          </>
        )}
        {hint && <p className="basis-full text-xs text-ivory-500">{hint}</p>}
      </div>
      {error && (
        <Alert kind="error" className="mt-2">
          {error}
        </Alert>
      )}
    </div>
  );
}
