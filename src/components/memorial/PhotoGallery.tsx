"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { imageUrl, publicUrl } from "@/lib/storage";
import type { MemorialPhoto } from "@/lib/supabase/types";
import { SectionHeading } from "./SectionHeading";

/* eslint-disable @next/next/no-img-element -- user uploaded gallery images from Supabase storage */

export function PhotoGallery({ photos, name }: { photos: MemorialPhoto[]; name: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setIndex(null);
    triggerRef.current?.focus();
  }, []);
  const prev = useCallback(() => setIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length)), [photos.length]);
  const next = useCallback(() => setIndex((i) => (i === null ? null : (i + 1) % photos.length)), [photos.length]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, close, prev, next]);

  if (photos.length === 0) return null;
  const current = index === null ? null : photos[index];
  const alt = (p: MemorialPhoto) => p.caption || `Photo of ${name}`;

  return (
    <section id="photos" aria-labelledby="photos-heading" className="scroll-mt-32">
      <SectionHeading id="photos-heading" eyebrow="Gallery" title="Photos" aside={`${photos.length} ${photos.length === 1 ? "photo" : "photos"}`} />
      <ul className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>li]:mb-3 [&>li]:break-inside-avoid">
        {photos.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={(e) => {
                triggerRef.current = e.currentTarget;
                setIndex(i);
              }}
              className="group relative block w-full overflow-hidden rounded-xl bg-navy-800 ring-1 ring-white/5 transition hover:ring-gold-400/50 focus-visible:ring-gold-400"
              aria-label={`Open photo ${i + 1} of ${photos.length}${p.caption ? `: ${p.caption}` : ""}`}
            >
              <img
                src={imageUrl(p.storage_path, { width: 700, quality: 78 }) ?? ""}
                alt={alt(p)}
                width={p.width ?? undefined}
                height={p.height ?? undefined}
                loading="lazy"
                className="h-auto w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              {(p.caption || p.year) && (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/85 to-transparent px-3 pb-2.5 pt-8 text-left text-xs text-ivory-100 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                  {p.caption && <span className="line-clamp-1">{p.caption}</span>}
                  {p.year && <span className="text-gold-300">{p.year}</span>}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {current && (
        <div role="dialog" aria-modal="true" aria-label={`Photo ${index! + 1} of ${photos.length}`} className="fixed inset-0 z-[60] flex flex-col bg-navy-950/95 backdrop-blur-sm animate-fade-in" onClick={close}>
          <div className="flex items-center justify-between px-4 py-3 text-sm text-ivory-400">
            <span>
              {index! + 1} / {photos.length}
            </span>
            <button ref={closeRef} type="button" onClick={close} aria-label="Close photo" className="rounded-full p-2 text-ivory-200 hover:bg-white/10">
              <X size={22} />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16" onClick={(e) => e.stopPropagation()}>
            {photos.length > 1 && (
              <button type="button" onClick={prev} aria-label="Previous photo" className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-navy-900/70 p-2.5 text-ivory-100 hover:bg-navy-800 sm:left-4">
                <ChevronLeft size={24} />
              </button>
            )}
            <img key={current.id} src={publicUrl(current.storage_path) ?? ""} alt={alt(current)} className="max-h-full max-w-full rounded-lg object-contain shadow-soft animate-fade-in" />
            {photos.length > 1 && (
              <button type="button" onClick={next} aria-label="Next photo" className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-navy-900/70 p-2.5 text-ivory-100 hover:bg-navy-800 sm:right-4">
                <ChevronRight size={24} />
              </button>
            )}
          </div>
          <div className="px-5 pb-6 pt-3 text-center" onClick={(e) => e.stopPropagation()}>
            {current.caption && <p className="font-display text-lg text-ivory-100">{current.caption}</p>}
            <p className="mt-1 flex flex-wrap justify-center gap-x-3 text-xs text-ivory-400">
              {current.year && <span className="text-gold-300">{current.year}</span>}
              {current.location && <span>{current.location}</span>}
              {current.people_shown && <span>With {current.people_shown}</span>}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
