"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Film, Link2, Trash2, UploadCloud } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { addVideo, deleteVideo } from "@/lib/actions/memorial";
import { publicUrl, UPLOAD_LIMITS } from "@/lib/storage";
import type { Memorial, MemorialVideo } from "@/lib/supabase/types";
import { uploadToBucket } from "@/lib/upload";
import { errorMessage } from "@/lib/utils";
import { planAllows, PlanNotice, Section } from "./shared";

export function VideosTab({ memorial, videos: initial, limits }: { memorial: Memorial; videos: MemorialVideo[]; limits: Record<string, unknown> }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [videos, setVideos] = useState(initial);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const allowed = planAllows(limits, "videos");
  const limitsV = UPLOAD_LIMITS["memorial-videos"];

  function addLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await addVideo({ memorial_id: memorial.id, slug: memorial.slug, external_url: url.trim(), title: title.trim() || null });
      if (!res.ok || !res.data) {
        setError(res.ok ? "Could not add the video." : res.error);
        return;
      }
      const v = res.data;
      setVideos((list) => [...list, v]);
      setUrl("");
      setTitle("");
      router.refresh();
    });
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(5);
    try {
      const up = await uploadToBucket("memorial-videos", file, { onProgress: setUploading });
      const res = await addVideo({ memorial_id: memorial.id, slug: memorial.slug, storage_path: up.path, byte_size: up.bytes, title: title.trim() || file.name.replace(/\.[^.]+$/, "") });
      if (!res.ok || !res.data) throw new Error(res.ok ? "Could not save the video." : res.error);
      const v = res.data;
      setVideos((list) => [...list, v]);
      setTitle("");
      router.refresh();
    } catch (e) {
      setError(errorMessage(e, "Upload failed"));
    } finally {
      setUploading(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function remove(v: MemorialVideo) {
    if (!window.confirm("Remove this video from the memorial?")) return;
    setVideos((list) => list.filter((x) => x.id !== v.id));
    startTransition(async () => {
      const res = await deleteVideo({ id: v.id, slug: memorial.slug });
      if (!res.ok) {
        setError(res.error);
        setVideos((list) => [...list, v]);
      } else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {!allowed && <PlanNotice feature="Videos" />}
      <Section title="Add a video" description="Link a YouTube or Vimeo video, or upload a file directly.">
        <form onSubmit={addLink} className="space-y-3" aria-label="Add a video link">
          <div>
            <label className="label" htmlFor="video-title">
              Title <span className="normal-case tracking-normal text-ivory-500">(optional)</span>
            </label>
            <input id="video-title" className="input" placeholder="e.g. 80th birthday speech" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} disabled={!allowed} />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Link2 size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ivory-500" aria-hidden />
              <input id="video-url" className="input pl-10" type="url" placeholder="https://youtube.com/watch?v=… or https://vimeo.com/…" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Video link" disabled={!allowed} />
            </div>
            <button type="submit" className="btn-primary" disabled={!allowed || pending || !url.trim()}>
              {pending ? <Spinner className="h-4 w-4 border-navy-900/40 border-t-navy-900" /> : "Add link"}
            </button>
          </div>
        </form>
        <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-widest text-ivory-500">
          <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
        </div>
        <input ref={inputRef} type="file" accept={limitsV.mimes.join(",")} className="sr-only" aria-label="Upload a video file" onChange={(e) => void upload(e.target.files?.[0])} />
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn-secondary" onClick={() => inputRef.current?.click()} disabled={!allowed || uploading !== null}>
            {uploading !== null ? <Spinner className="h-4 w-4" /> : <UploadCloud size={16} />} {uploading !== null ? `Uploading ${uploading}%` : "Upload a video file"}
          </button>
          <span className="text-xs text-ivory-500">MP4, WebM or MOV · up to {Math.round(limitsV.maxBytes / 1024 / 1024)} MB</span>
        </div>
        {error && (
          <Alert kind="error" className="mt-4">
            {error}
          </Alert>
        )}
      </Section>

      <Section title="Videos" description={`${videos.length} video${videos.length === 1 ? "" : "s"} on this memorial.`}>
        {videos.length === 0 ? (
          <EmptyState title="No videos yet" body="A voice, a laugh, a moment in motion — videos are a powerful way to remember." />
        ) : (
          <ul className="divide-y divide-white/8" aria-label="Videos">
            {videos.map((v) => {
              const href = v.external_url ?? publicUrl(v.storage_path);
              return (
                <li key={v.id} className="flex items-center gap-4 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-navy-950/60 text-gold-300" aria-hidden>
                    <Film size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ivory-100">{v.title || (v.external_url ? "Linked video" : "Uploaded video")}</p>
                    <p className="truncate text-xs text-ivory-500">{v.external_url ?? (v.byte_size ? `${(v.byte_size / 1024 / 1024).toFixed(1)} MB upload` : "Uploaded file")}</p>
                  </div>
                  {href && (
                    <a href={href} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-1.5 text-xs" aria-label={`Open ${v.title || "video"}`}>
                      <ExternalLink size={14} /> Open
                    </a>
                  )}
                  <button type="button" className="btn-ghost px-3 py-1.5 text-xs text-danger-400" onClick={() => remove(v)} disabled={pending} aria-label={`Delete ${v.title || "video"}`}>
                    <Trash2 size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}
