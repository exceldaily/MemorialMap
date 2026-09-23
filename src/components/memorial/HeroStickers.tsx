import type { CSSProperties } from "react";
import type { MotifKey } from "@/lib/appearance";
import { cn } from "@/lib/utils";
import { MOTIF_ICONS } from "./motifs";

const SLOTS: { style: CSSProperties; rotate: number; delay: number; mobile: boolean }[] = [
  { style: { left: "5%", top: "16%" }, rotate: -12, delay: 0, mobile: true },
  { style: { right: "7%", top: "12%" }, rotate: 10, delay: 1.3, mobile: true },
  { style: { left: "11%", bottom: "18%" }, rotate: 8, delay: 0.6, mobile: true },
  { style: { right: "12%", bottom: "22%" }, rotate: -8, delay: 1.9, mobile: false },
  { style: { left: "27%", top: "7%" }, rotate: 14, delay: 2.5, mobile: false },
  { style: { right: "29%", top: "9%" }, rotate: -16, delay: 0.9, mobile: false },
];

/** Gently floating motifs around the header. Decorative only, never in the way. */
export function HeroStickers({ stickers, compact = false, className }: { stickers: MotifKey[]; compact?: boolean; className?: string }) {
  if (!stickers.length) return null;
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 z-[1] overflow-hidden", className)}>
      {stickers.slice(0, SLOTS.length).map((key, i) => {
        const Icon = MOTIF_ICONS[key];
        const slot = SLOTS[i];
        const size = compact ? (i % 2 ? 12 : 15) : i % 2 ? 30 : 38;
        return (
          <span key={key} className={cn("absolute text-gold-400/55", !slot.mobile && !compact && "hidden sm:block")} style={{ ...slot.style, transform: `rotate(${slot.rotate}deg)` }}>
            <span className="block animate-float" style={{ animationDelay: `${slot.delay}s` }}>
              <Icon size={size} strokeWidth={1.4} />
            </span>
          </span>
        );
      })}
    </div>
  );
}
