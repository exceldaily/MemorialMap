"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, X } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { submitMemory } from "@/lib/actions/engagement";
import { uploadToBucket, removeFromBucket } from "@/lib/upload";
import { errorMessage } from "@/lib/utils";

/* eslint-disable @next/next/no-img-element -- local object-URL preview */

export function MemoryForm({ memorialId, slug, name, onSubmitted }: { memorialId: string; slug: string; name: string; onSubmitted: (id: string, values: { relationship: string; body: string; photo_path: string | null }) => void }) {
  const [relationship, setRelationship] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const pickFile = (f: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!body.trim()) {
      setError("Write a memory to share.");
      return;
    }
    let photo_path: string | null = null;
    if (file) {
      setUploading(true);
      try {
        photo_path = (await uploadToBucket("memorial-memory-photos", file, { maxEdge: 1600 })).path;
      } catch (err) {
        setError(errorMessage(err));
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    startTransition(async () => {
      const res = await submitMemory({ memorial_id: memorialId, slug, relationship, body, photo_path: photo_path ?? "" });
      if (!res.ok) {
        if (photo_path) void removeFromBucket(photo_path);
        setError(res.error);
        return;
      }
      onSubmitted(res.data?.id ?? crypto.randomUUID(), { relationship, body, photo_path });
      setRelationship("");
      setBody("");
      pickFile(null);
    });
  };

  const busy = uploading || pending;

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-5 sm:p-6" aria-labelledby="memory-form-heading">
      <div>
        <h3 id="memory-form-heading" className="text-2xl text-ivory-50">
          Share a memory
        </h3>
        <p className="mt-1 text-sm text-ivory-400">A story, a moment, a few words. The family reviews memories before they appear.</p>
      </div>
      <div>
        <label htmlFor="memory-relationship" className="label">
          Your relationship to {name}
        </label>
        <input id="memory-relationship" value={relationship} onChange={(e) => setRelationship(e.target.value)} maxLength={80} className="input" placeholder="Niece, neighbour, old friend…" autoComplete="off" />
      </div>
      <div>
        <label htmlFor="memory-body" className="label">
          Your memory
        </label>
        <textarea id="memory-body" value={body} onChange={(e) => setBody(e.target.value)} rows={5} maxLength={5000} required className="input resize-y" placeholder="Every summer they took us fishing…" />
        <p className="mt-1 text-right text-[11px] text-ivory-500">{body.length.toLocaleString()} / 5,000</p>
      </div>
      <div>
        <input
          ref={fileInput}
          id="memory-photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
        {preview ? (
          <div className="relative inline-block">
            <img src={preview} alt="Photo you selected to attach" className="max-h-48 rounded-xl ring-1 ring-white/10" />
            <button
              type="button"
              onClick={() => {
                pickFile(null);
                if (fileInput.current) fileInput.current.value = "";
              }}
              aria-label="Remove photo"
              className="absolute -right-2 -top-2 rounded-full bg-navy-800 p-1.5 text-ivory-200 ring-1 ring-white/15 hover:bg-navy-700"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label htmlFor="memory-photo" className="btn-ghost cursor-pointer border border-dashed border-white/15">
            <ImagePlus size={16} aria-hidden />
            Add a photo <span className="text-ivory-500">(optional)</span>
          </label>
        )}
      </div>
      {error && <Alert kind="error">{error}</Alert>}
      <div className="flex justify-end">
        <button type="submit" disabled={busy} className="btn-primary min-w-40">
          {busy ? <Spinner className="h-4 w-4" /> : "Share memory"}
        </button>
      </div>
    </form>
  );
}
