import type { ReactNode } from "react";
import type { FrameKey } from "@/lib/appearance";
import { cn } from "@/lib/utils";

/**
 * Decorative frame around a portrait. Pure CSS and inline SVG in the accent
 * colour, so it follows the theme. `size` is the portrait's rendered size in
 * pixels; the decorations scale from it.
 */
export function PortraitFrame({ frame, size, shape = "round", className, children }: { frame: FrameKey; size: number; shape?: "round" | "rect"; className?: string; children: ReactNode }) {
  if (frame === "none") return <div className={cn("relative inline-block", className)}>{children}</div>;
  const round = shape === "round";
  const radius = round ? "rounded-full" : "rounded-3xl";
  const pad = Math.round(size * 0.07);
  return (
    <div className={cn("relative inline-block", className)} style={{ padding: frame === "laurel" || frame === "petals" ? Math.round(size * 0.16) : pad }}>
      {frame === "gilded" && (
        <>
          <span aria-hidden className={cn("pointer-events-none absolute inset-0 border-[3px] border-double border-gold-400", radius)} />
          <span aria-hidden className={cn("pointer-events-none absolute border border-gold-300/70", radius)} style={{ inset: Math.round(pad * 0.45) }} />
          {round &&
            [0, 90, 180, 270].map((deg) => (
              <span key={deg} aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5 bg-gold-400 shadow-soft" style={{ transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(${-(size / 2 + pad)}px) rotate(45deg)` }} />
            ))}
        </>
      )}
      {frame === "halo" && (
        <>
          <span aria-hidden className={cn("pointer-events-none absolute animate-pulse-soft", radius)} style={{ inset: -Math.round(size * 0.05), boxShadow: `0 0 ${Math.round(size * 0.35)}px ${Math.round(size * 0.12)}px color-mix(in oklab, var(--color-gold-400) 45%, transparent)` }} />
          <span aria-hidden className={cn("pointer-events-none absolute inset-0 border border-gold-300/70", radius)} />
        </>
      )}
      {frame === "vintage" && (
        <span aria-hidden className={cn("pointer-events-none absolute inset-0 bg-ivory-100", radius)} style={{ boxShadow: `inset 0 0 0 ${Math.max(2, Math.round(pad * 0.3))}px var(--color-gold-600), inset 0 0 0 ${Math.max(4, Math.round(pad * 0.55))}px var(--color-ivory-200), 0 10px 30px -12px rgb(0 0 0 / 0.5)` }} />
      )}
      {frame === "laurel" && (
        <>
          <Laurel className="pointer-events-none absolute -left-[2%] bottom-0 h-[105%] w-auto text-gold-400" />
          <Laurel className="pointer-events-none absolute -right-[2%] bottom-0 h-[105%] w-auto -scale-x-100 text-gold-400" />
        </>
      )}
      {frame === "petals" && <Petals className="pointer-events-none absolute inset-0 h-full w-full text-gold-400" />}
      <div className="relative">{children}</div>
    </div>
  );
}

/** One laurel branch: a curved stem with leaves along it. Mirror it with -scale-x-100 for the other side. */
function Laurel({ className }: { className?: string }) {
  const p0 = [104, 214];
  const p1 = [6, 128];
  const p2 = [34, 18];
  const at = (t: number) => {
    const x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0];
    const y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1];
    const dx = 2 * (1 - t) * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    const dy = 2 * (1 - t) * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
  };
  const leaves = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map(at);
  return (
    <svg viewBox="0 0 120 224" className={className} aria-hidden fill="none">
      <path d={`M${p0[0]} ${p0[1]} Q ${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}`} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
      {leaves.map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.angle})`}>
          <ellipse cx="0" cy="-9" rx="5.5" ry="12" transform="rotate(-38)" fill="currentColor" opacity="0.55" />
          <ellipse cx="0" cy="9" rx="5.5" ry="12" transform="rotate(38)" fill="currentColor" opacity="0.7" />
        </g>
      ))}
    </svg>
  );
}

/** A wreath of petals all the way round. */
function Petals({ className }: { className?: string }) {
  const n = 16;
  return (
    <svg viewBox="0 0 240 240" className={className} aria-hidden fill="none">
      {Array.from({ length: n }, (_, i) => (
        <g key={i} transform={`rotate(${(i * 360) / n} 120 120)`}>
          <ellipse cx="120" cy="16" rx="8" ry="17" fill="currentColor" opacity={i % 2 ? 0.42 : 0.62} stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
        </g>
      ))}
      <circle cx="120" cy="120" r="103" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}
