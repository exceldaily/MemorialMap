"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, MapPin, User, X } from "lucide-react";
import { lifeYears } from "@/lib/format";
import type { SearchResult } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type PlaceResult = { name: string; full: string; lat: number; lng: number };

export function MapSearch({
  onPlace,
  onMemorial,
  className,
  placeholder = "Search places or memorial names",
}: {
  onPlace: (p: PlaceResult) => void;
  onMemorial?: (m: SearchResult) => void;
  className?: string;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [memorials, setMemorials] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => boxRef.current && !boxRef.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setPlaces([]);
      setMemorials([]);
      return;
    }
    const ac = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const [p, m] = await Promise.all([
          fetch(`/api/geocode?q=${encodeURIComponent(term)}`, { signal: ac.signal }).then((r) => (r.ok ? r.json() : { results: [] })),
          fetch(`/api/search?q=${encodeURIComponent(term)}&limit=5`, { signal: ac.signal }).then((r) => (r.ok ? r.json() : { results: [] })),
        ]);
        setPlaces(p.results ?? []);
        setMemorials(m.results ?? []);
        setOpen(true);
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [q]);

  const hasResults = places.length > 0 || memorials.length > 0;

  return (
    <div ref={boxRef} className={cn("relative w-full max-w-md", className)}>
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-navy-900/85 px-4 py-2 shadow-soft backdrop-blur-md focus-within:border-gold-400/50">
        <Search size={16} className="shrink-0 text-ivory-400" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => hasResults && setOpen(true)}
          placeholder={placeholder}
          aria-label="Search places or memorials"
          className="w-full bg-transparent text-sm text-ivory-100 placeholder:text-ivory-500 focus:outline-none"
        />
        {q && (
          <button type="button" onClick={() => { setQ(""); setOpen(false); }} aria-label="Clear search" className="text-ivory-500 hover:text-ivory-200">
            <X size={14} />
          </button>
        )}
      </div>
      {open && (loading || hasResults) && (
        <div className="card absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-y-auto p-1.5 animate-fade-in" role="listbox">
          {loading && !hasResults && <p className="px-3 py-2 text-xs text-ivory-500">Searching…</p>}
          {memorials.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-widest text-ivory-500">Memorials</p>
              {memorials.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="option"
                  aria-selected="false"
                  onClick={() => { setOpen(false); onMemorial?.(m); }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/8"
                >
                  <User size={14} className="shrink-0 text-gold-400" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ivory-100">{m.full_name}</span>
                    <span className="block truncate text-xs text-ivory-500">{[lifeYears(m.birth_year, m.death_year), m.place_name].filter(Boolean).join(" · ")}</span>
                  </span>
                  <Link href={`/memorial/${m.slug}`} onClick={(e) => e.stopPropagation()} className="text-xs text-gold-400 hover:underline">
                    Visit
                  </Link>
                </button>
              ))}
            </>
          )}
          {places.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-2 text-[10px] uppercase tracking-widest text-ivory-500">Places</p>
              {places.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  role="option"
                  aria-selected="false"
                  onClick={() => { setOpen(false); setQ(p.full); onPlace(p); }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/8"
                >
                  <MapPin size={14} className="shrink-0 text-sage-400" aria-hidden />
                  <span className="truncate text-sm text-ivory-100">{p.full}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
