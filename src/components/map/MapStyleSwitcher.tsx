"use client";

import { MAP_STYLES, type MapStyleKey } from "./MemorialMap";
import { cn } from "@/lib/utils";

export function MapStyleSwitcher({ value, onChange, className }: { value: MapStyleKey; onChange: (k: MapStyleKey) => void; className?: string }) {
  return (
    <div className={cn("inline-flex rounded-full border border-white/10 bg-navy-900/85 p-1 shadow-soft backdrop-blur-md", className)} role="radiogroup" aria-label="Map style">
      {(Object.keys(MAP_STYLES) as MapStyleKey[]).map((k) => (
        <button
          key={k}
          type="button"
          role="radio"
          aria-checked={value === k}
          onClick={() => onChange(k)}
          className={cn("rounded-full px-3 py-1 text-xs font-medium transition", value === k ? "bg-gold-400 text-navy-950" : "text-ivory-300 hover:text-ivory-50")}
        >
          {MAP_STYLES[k].label}
        </button>
      ))}
    </div>
  );
}
