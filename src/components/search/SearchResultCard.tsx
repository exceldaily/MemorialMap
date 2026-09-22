"use client";

import Link from "next/link";
import { MapPin, Heart, MessageCircle } from "lucide-react";
import type { SearchResult } from "@/lib/supabase/types";
import { Avatar } from "@/components/ui/Avatar";
import { lifeYears, truncate, compactNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Compact horizontal result row used in the search list and beside the map. */
export function SearchResultCard({ r, active, onFocus, compact }: { r: SearchResult; active?: boolean; onFocus?: () => void; compact?: boolean }) {
  return (
    <article
      className={cn("card relative flex gap-4 p-4 transition-colors", active && "border-gold-400/50", onFocus && "cursor-pointer hover:border-gold-400/30")}
      onClick={onFocus}
      onKeyDown={onFocus ? (e) => { if (e.key === "Enter" && e.target === e.currentTarget) onFocus(); } : undefined}
      tabIndex={onFocus ? 0 : undefined}
      aria-current={onFocus && active ? "true" : undefined}
      aria-label={onFocus ? `Show ${r.full_name} on the map` : undefined}
    >
      <Avatar path={r.profile_image_path} name={r.full_name} size={compact ? 44 : 56} />
      <div className="min-w-0 flex-1">
        <h3 className={cn("leading-tight text-ivory-50", compact ? "text-xl" : "text-2xl")}>
          <Link href={`/memorial/${r.slug}`} className="hover:text-gold-200" onClick={(e) => e.stopPropagation()}>
            {r.full_name}
          </Link>
          {r.nickname && <span className="ml-2 text-base text-ivory-500">“{r.nickname}”</span>}
        </h3>
        <p className="text-sm text-gold-300">{lifeYears(r.birth_year, r.death_year)}</p>
        {r.place_name && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ivory-500">
            <MapPin size={12} aria-hidden /> <span className="truncate">{r.place_name}</span>
          </p>
        )}
        {!compact && r.epitaph && <p className="mt-2 font-display text-lg italic text-ivory-200">“{truncate(r.epitaph, 120)}”</p>}
        <p className="mt-2 flex items-center gap-4 text-xs text-ivory-500">
          <span className="inline-flex items-center gap-1">
            <Heart size={12} aria-hidden /> {compactNumber(r.tributes_count)} <span className="sr-only">tributes</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle size={12} aria-hidden /> {compactNumber(r.memories_count)} <span className="sr-only">memories</span>
          </span>
        </p>
      </div>
    </article>
  );
}
