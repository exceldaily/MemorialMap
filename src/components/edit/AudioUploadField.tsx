"use client";

import { useId, useRef, useState } from "react";
import { Music, Trash2, UploadCloud } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { publicUrl, UPLOAD_LIMITS } from "@/lib/storage";
import { removeFromBucket, uploadToBucket } from "@/lib/upload";
import { cn, errorMessage } from "@/lib/utils";

const BUCKET = "memorial-audio" as const;

/** Single audio upload with a native preview player, progress and removal. The parent persists the path. */
export function AudioUploadField({ label, value, onChange, disabled, className }: { label: string; value: string | null; onChange: (path: string | null) => void; disabled?: boolean; className?: string }) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const src = publicUrl(value);
  const limits = UPLOAD_LIMITS[BUCKET];

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setProgress(5);
    try {
      const previous = value;
      const res = await uploadToBucket(BUCKET, file, { onProgress: setProgress });
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
      <div className={cn("rounded-2xl border border-dashed border-white/15 bg-navy-950/40 p-4", disabled && "opacity-50")}>
        {src ? (
          <div className="space-y-3">
            <audio controls preload="none" src={src} className="w-full" />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-secondary px-4 py-1.5 text-xs" onClick={() => inputRef.current?.click()} disabled={disabled || progress !== null}>
                <UploadCloud size={14} /> Replace
              </button>
              <button type="button" className="btn-ghost px-3 py-1.5 text-xs text-danger-400" onClick={remove} disabled={disabled || progress !== null}>
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled || progress !== null} aria-labelledby={`${id}-label`} className="flex w-full flex-col items-center justify-center gap-2 py-4 text-center text-ivory-400 hover:text-ivory-100">
            {progress !== null ? <Spinner /> : <Music size={26} className="text-gold-400" aria-hidden />}
            <span className="text-sm">{progress !== null ? "Uploading…" : "Choose an audio file"}</span>
            <span className="text-[11px] text-ivory-500">MP3, M4A, AAC, OGG or WAV · up to {Math.round(limits.maxBytes / 1024 / 1024)} MB</span>
          </button>
        )}
        {progress !== null && (
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
            <div className="h-full bg-gold-400 transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      <input ref={inputRef} id={id} type="file" accept={limits.mimes.join(",")} className="sr-only" disabled={disabled} onChange={(e) => void handleFile(e.target.files?.[0])} aria-labelledby={`${id}-label`} />
      {error && (
        <Alert kind="error" className="mt-2">
          {error}
        </Alert>
      )}
    </div>
  );
}
