"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ImagePlus, Pencil, Trash2, X } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { addPhoto, deletePhoto, reorderPhotos, updatePhoto } from "@/lib/actions/memorial";
import { imageUrl, UPLOAD_LIMITS } from "@/lib/storage";
import type { Memorial, MemorialPhoto } from "@/lib/supabase/types";
import { uploadToBucket } from "@/lib/upload";
import { cn, errorMessage } from "@/lib/utils";
import { planNumber, Section } from "./shared";

type UploadItem = { id: string; name: string; pct: number; error?: string };

export function PhotosTab({ memorial, photos: initial, limits }: { memorial: Memorial; photos: MemorialPhoto[]; limits: Record<string, unknown> }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<MemorialPhoto[]>(initial);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const maxPhotos = planNumber(limits, "max_photos");
  const remaining = maxPhotos === null ? Infinity : Math.max(0, maxPhotos - photos.length);
  const atLimit = remaining <= 0;
  const accept = UPLOAD_LIMITS["memorial-gallery"].mimes.join(",");

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setError(null);
    const files = Array.from(list).slice(0, Number.isFinite(remaining) ? remaining : undefined);
    if (files.length < list.length) setError(`Only ${files.length} more photo${files.length === 1 ? "" : "s"} can be added on your current plan.`);
    if (inputRef.current) inputRef.current.value = "";
    await Promise.all(
      files.map(async (file) => {
        const id = crypto.randomUUID();
        setUploads((u) => [...u, { id, name: file.name, pct: 5 }]);
        try {
          const res = await uploadToBucket("memorial-gallery", file, { maxEdge: 2400, onProgress: (pct) => setUploads((u) => u.map((x) => (x.id === id ? { ...x, pct } : x))) });
          const saved = await addPhoto({ memorial_id: memorial.id, slug: memorial.slug, storage_path: res.path, width: res.width, height: res.height, byte_size: res.bytes });
          if (!saved.ok || !saved.data) throw new Error(saved.ok ? "Could not save the photo." : saved.error);
          const photo = saved.data;
          setPhotos((p) => [...p, photo]);
          setUploads((u) => u.filter((x) => x.id !== id));
        } catch (e) {
          setUploads((u) => u.map((x) => (x.id === id ? { ...x, error: errorMessage(e, "Upload failed") } : x)));
        }
      }),
    );
    router.refresh();
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[index], next[target]] = [next[target], next[index]];
    const ordered = next.map((p, i) => ({ ...p, sort_order: i }));
    setPhotos(ordered);
    startTransition(async () => {
      const res = await reorderPhotos({ slug: memorial.slug, order: ordered.map((p) => ({ id: p.id, sort_order: p.sort_order })) });
      if (!res.ok) setError(res.error);
    });
  }

  function remove(photo: MemorialPhoto) {
    if (!window.confirm("Remove this photo from the memorial? This cannot be undone.")) return;
    setPhotos((p) => p.filter((x) => x.id !== photo.id));
    startTransition(async () => {
      const res = await deletePhoto({ id: photo.id, slug: memorial.slug });
      if (!res.ok) {
        setError(res.error);
        setPhotos((p) => [...p, photo].sort((a, b) => a.sort_order - b.sort_order));
      } else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Section
        title="Photo gallery"
        description="Add the photos that tell their story. Each can carry a caption, year, place and the people shown."
        actions={
          <button type="button" className="btn-primary" onClick={() => inputRef.current?.click()} disabled={atLimit}>
            <ImagePlus size={16} /> Add photos
          </button>
        }
      >
        <input ref={inputRef} type="file" accept={accept} multiple className="sr-only" aria-label="Add photos" onChange={(e) => void handleFiles(e.target.files)} />
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-ivory-500">
          <span>
            {photos.length} photo{photos.length === 1 ? "" : "s"}
            {maxPhotos !== null && ` · ${maxPhotos} included in your plan`}
          </span>
          <span>JPG, PNG or WebP · up to {Math.round(UPLOAD_LIMITS["memorial-gallery"].maxBytes / 1024 / 1024)} MB each</span>
        </div>
        {atLimit && <Alert kind="warning" className="mb-4">You&apos;ve reached the {maxPhotos}-photo limit for your current plan. Remove a photo to add another, or upgrade for more room.</Alert>}
        {error && (
          <Alert kind="error" className="mb-4">
            {error}
          </Alert>
        )}

        {uploads.length > 0 && (
          <ul className="mb-4 space-y-2" aria-label="Uploads in progress">
            {uploads.map((u) => (
              <li key={u.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-navy-950/40 px-3 py-2 text-sm">
                {u.error ? <X size={16} className="text-danger-400" aria-hidden /> : <Spinner className="h-4 w-4" />}
                <span className="min-w-0 flex-1 truncate text-ivory-200">{u.name}</span>
                {u.error ? (
                  <span className="text-xs text-danger-400">{u.error}</span>
                ) : (
                  <span className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={u.pct} aria-valuemin={0} aria-valuemax={100}>
                    <span className="block h-full bg-gold-400" style={{ width: `${u.pct}%` }} />
                  </span>
                )}
                {u.error && (
                  <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => setUploads((x) => x.filter((y) => y.id !== u.id))} aria-label="Dismiss">
                    <X size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {photos.length === 0 && uploads.length === 0 ? (
          <EmptyState title="No photos yet" body="Photos bring a memorial to life. Add a few favourites to begin the gallery." action={<button type="button" className="btn-primary" onClick={() => inputRef.current?.click()}><ImagePlus size={16} /> Add photos</button>} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Gallery photos">
            {photos.map((photo, i) => (
              <li key={photo.id} className="overflow-hidden rounded-2xl border border-white/10 bg-navy-950/40">
                <div className="relative aspect-[4/3] bg-navy-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl(photo.storage_path, { width: 800, quality: 75 }) ?? ""} alt={photo.caption || `Photo ${i + 1} of ${memorial.full_name}`} className="h-full w-full object-cover" loading="lazy" />
                  <div className="absolute left-2 top-2 flex gap-1">
                    <button type="button" className="rounded-full bg-navy-950/80 p-1.5 text-ivory-200 hover:bg-navy-950 disabled:opacity-40" onClick={() => move(i, -1)} disabled={i === 0 || pending} aria-label="Move photo earlier">
                      <ArrowUp size={14} />
                    </button>
                    <button type="button" className="rounded-full bg-navy-950/80 p-1.5 text-ivory-200 hover:bg-navy-950 disabled:opacity-40" onClick={() => move(i, 1)} disabled={i === photos.length - 1 || pending} aria-label="Move photo later">
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  <span className="absolute right-2 top-2 rounded-full bg-navy-950/80 px-2 py-0.5 text-[11px] text-ivory-300">{i + 1}</span>
                </div>
                <div className="p-3">
                  {editing === photo.id ? (
                    <PhotoEditor
                      photo={photo}
                      slug={memorial.slug}
                      onCancel={() => setEditing(null)}
                      onSaved={(p) => {
                        setPhotos((list) => list.map((x) => (x.id === p.id ? p : x)));
                        setEditing(null);
                        router.refresh();
                      }}
                    />
                  ) : (
                    <>
                      <p className={cn("text-sm", photo.caption ? "text-ivory-100" : "italic text-ivory-500")}>{photo.caption || "No caption"}</p>
                      <p className="mt-1 text-xs text-ivory-500">{[photo.year, photo.location, photo.people_shown].filter(Boolean).join(" · ") || "Add a year, place or people"}</p>
                      <div className="mt-3 flex gap-2">
                        <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={() => setEditing(photo.id)}>
                          <Pencil size={13} /> Edit details
                        </button>
                        <button type="button" className="btn-ghost px-3 py-1.5 text-xs text-danger-400" onClick={() => remove(photo)} disabled={pending} aria-label="Delete photo">
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function PhotoEditor({ photo, slug, onCancel, onSaved }: { photo: MemorialPhoto; slug: string; onCancel: () => void; onSaved: (p: MemorialPhoto) => void }) {
  const [caption, setCaption] = useState(photo.caption ?? "");
  const [year, setYear] = useState(photo.year ? String(photo.year) : "");
  const [location, setLocation] = useState(photo.location ?? "");
  const [people, setPeople] = useState(photo.people_shown ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updatePhoto({ id: photo.id, slug, caption, year: year ? Number(year) : null, location, people_shown: people });
      if (!res.ok || !res.data) {
        setError(res.ok ? "Could not save" : res.error);
        return;
      }
      onSaved(res.data);
    });
  }

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      aria-label="Edit photo details"
    >
      <input className="input py-2 text-sm" placeholder="Caption" value={caption} onChange={(e) => setCaption(e.target.value)} aria-label="Caption" maxLength={500} />
      <div className="grid grid-cols-[6rem_1fr] gap-2">
        <input className="input py-2 text-sm" placeholder="Year" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))} aria-label="Year" />
        <input className="input py-2 text-sm" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} aria-label="Location" maxLength={200} />
      </div>
      <input className="input py-2 text-sm" placeholder="People shown" value={people} onChange={(e) => setPeople(e.target.value)} aria-label="People shown" maxLength={300} />
      {error && <p className="text-xs text-danger-400">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={onCancel} disabled={pending}>
          Cancel
        </button>
        <button type="submit" className="btn-primary px-3 py-1.5 text-xs" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
