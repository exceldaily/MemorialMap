"use client";

import { Globe2, Link2, Lock } from "lucide-react";
import type { PrivacyLevel } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export const PRIVACY_OPTIONS: { value: PrivacyLevel; title: string; body: string; Icon: typeof Globe2 }[] = [
  { value: "public", title: "Public", body: "Visible on the memorial map and in search. Anyone can visit, leave a tribute or share a memory.", Icon: Globe2 },
  { value: "unlisted", title: "Unlisted", body: "Hidden from the map and search. Only people you share the link or QR code with can visit.", Icon: Link2 },
  { value: "private", title: "Private", body: "Only you and the people you invite as administrators or contributors can see this memorial.", Icon: Lock },
];

export function PrivacyOptions({ value, onChange, disabled, name = "privacy" }: { value: PrivacyLevel; onChange: (v: PrivacyLevel) => void; disabled?: boolean; name?: string }) {
  return (
    <div className="grid gap-3" role="radiogroup" aria-label="Who can see this memorial">
      {PRIVACY_OPTIONS.map(({ value: v, title, body, Icon }) => {
        const selected = value === v;
        return (
          <label
            key={v}
            className={cn(
              "flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition sm:p-5",
              selected ? "border-gold-400/70 bg-gold-400/10 shadow-glow" : "border-white/10 bg-navy-950/40 hover:border-white/25",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <input type="radio" name={name} value={v} checked={selected} onChange={() => onChange(v)} disabled={disabled} className="sr-only" />
            <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border", selected ? "border-gold-400/60 bg-gold-400/15 text-gold-300" : "border-white/10 text-ivory-400")} aria-hidden>
              <Icon size={18} />
            </span>
            <span>
              <span className="block font-medium text-ivory-100">{title}</span>
              <span className="mt-0.5 block text-sm text-ivory-400">{body}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
