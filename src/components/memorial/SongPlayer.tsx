"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Music, Pause, Play } from "lucide-react";
import { isDirectAudioUrl, songProvider } from "@/lib/appearance";
import { cn } from "@/lib/utils";

function fmt(s: number) {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/**
 * "Their song". Plays an uploaded track (or a direct audio link) in the page,
 * or links out to a streaming service. Never starts on its own.
 */
export function SongPlayer({ src, external, title, name, className }: { src: string | null; external: string | null; title: string | null; name: string; className?: string }) {
  const playable = src ?? (external && isDirectAudioUrl(external) ? external : null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setTime(el.currentTime);
    const onMeta = () => setDuration(el.duration);
    const onEnd = () => setPlaying(false);
    const onErr = () => setFailed(true);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("durationchange", onMeta);
    el.addEventListener("ended", onEnd);
    el.addEventListener("error", onErr);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("durationchange", onMeta);
      el.removeEventListener("ended", onEnd);
      el.removeEventListener("error", onErr);
    };
  }, [playable]);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      void el.play().then(() => setPlaying(true)).catch(() => setFailed(true));
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const el = audioRef.current;
    if (!el || !duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    el.currentTime = Math.max(0, Math.min(duration, ((e.clientX - r.left) / r.width) * duration));
  }

  const label = title ?? `A song for ${name}`;
  const pct = duration ? Math.min(100, (time / duration) * 100) : 0;

  if (!playable && !external) return null;

  return (
    <div className={cn("card inline-flex w-full max-w-md items-center gap-3 px-3 py-2.5 text-left", className)}>
      {playable && !failed ? (
        <>
          <audio ref={audioRef} src={playable} preload="metadata" />
          <button type="button" onClick={toggle} aria-label={playing ? `Pause ${label}` : `Play ${label}`} aria-pressed={playing} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-400 text-navy-950 shadow-[0_8px_24px_-10px_rgb(211_184_119/0.7)] transition hover:bg-gold-300 active:scale-95">
            {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-[10px]">Their song</p>
            <p className="truncate font-display text-base leading-tight text-ivory-50">{label}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <div role="slider" aria-label="Seek" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} tabIndex={0} onClick={seek} className="relative h-1.5 flex-1 cursor-pointer overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-gold-400 transition-[width] duration-200" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-ivory-500">
                {fmt(time)} / {fmt(duration)}
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-400/15 text-gold-400">
            <Music size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-[10px]">Their song</p>
            <p className="truncate font-display text-base leading-tight text-ivory-50">{label}</p>
          </div>
        </>
      )}
      {external && !(playable === external && !failed) && (
        <a href={external} target="_blank" rel="noopener noreferrer" className="btn-secondary shrink-0 px-3 py-1.5 text-xs" aria-label={`Listen on ${songProvider(external)} (opens in a new tab)`}>
          <ExternalLink size={13} /> {songProvider(external)}
        </a>
      )}
    </div>
  );
}
