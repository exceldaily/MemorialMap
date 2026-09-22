import type { Metadata } from "next";
import Link from "next/link";
import { List, Map as MapIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SearchResult } from "@/lib/supabase/types";
import { Footer } from "@/components/layout/Footer";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchForm, type SearchQuery } from "@/components/search/SearchForm";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { SearchMapView } from "@/components/search/SearchMapView";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Search memorials",
  description: "Find a memorial by name, birth year or year of passing, and see where in the world their story lives.",
};

const LIMIT = 30;

type Params = { q?: string; birth?: string; death?: string; view?: string; offset?: string };

function yearOf(v: string | undefined) {
  const n = Number(v);
  return v && Number.isInteger(n) && n > 0 && n < 2200 ? n : null;
}

function buildHref(query: SearchQuery, overrides: Partial<{ view: string; offset: number }>) {
  const p = new URLSearchParams();
  if (query.q) p.set("q", query.q);
  if (query.birth) p.set("birth", query.birth);
  if (query.death) p.set("death", query.death);
  p.set("view", overrides.view ?? query.view);
  const offset = overrides.offset ?? 0;
  if (offset > 0) p.set("offset", String(offset));
  return `/search?${p.toString()}`;
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const query: SearchQuery = {
    q: (sp.q ?? "").trim().slice(0, 120),
    birth: yearOf(sp.birth) ? String(yearOf(sp.birth)) : "",
    death: yearOf(sp.death) ? String(yearOf(sp.death)) : "",
    view: sp.view === "map" ? "map" : "list",
  };
  const offset = Math.max(0, Number(sp.offset) || 0);
  const hasQuery = Boolean(query.q || query.birth || query.death);

  let results: SearchResult[] = [];
  let error: string | null = null;
  if (hasQuery) {
    const supabase = await createSupabaseServerClient();
    const { data, error: err } = await supabase.rpc("search_memorials", {
      p_query: query.q || null,
      p_birth_year: query.birth ? Number(query.birth) : null,
      p_death_year: query.death ? Number(query.death) : null,
      p_limit: LIMIT + 1,
      p_offset: offset,
    });
    if (err) error = err.message;
    results = data ?? [];
  }
  const hasMore = results.length > LIMIT;
  const page = results.slice(0, LIMIT);

  return (
    <>
      <main className="container-page py-10 sm:py-14">
        <header className="mb-8 max-w-2xl">
          <p className="eyebrow">Search</p>
          <h1 className="mt-2 text-4xl text-ivory-50 sm:text-5xl">Find a memorial</h1>
          <p className="mt-2 text-sm text-ivory-400">Search by name, birth year or year of passing. Every result has a place on the map you can visit.</p>
        </header>

        <SearchForm query={query} />

        {error && (
          <Alert kind="error" className="mt-6">
            Search is unavailable right now. {error}
          </Alert>
        )}

        {!hasQuery && !error && (
          <div className="mt-8">
            <EmptyState
              title="Who are you looking for?"
              body="Enter a name or a year above. You can also browse the world map to discover memorials near places that matter to you."
              action={
                <Link href="/map" className="btn-secondary">
                  <MapIcon size={16} aria-hidden /> Browse the map instead
                </Link>
              }
            />
          </div>
        )}

        {hasQuery && !error && (
          <section className="mt-8" aria-live="polite">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ivory-400" role="status">
                {page.length === 0
                  ? "No memorials found"
                  : `Showing ${offset + 1}–${offset + page.length}${hasMore ? "+" : ""} ${page.length === 1 && offset === 0 ? "result" : "results"}`}
                {query.q && (
                  <>
                    {" "}
                    for <span className="text-ivory-100">“{query.q}”</span>
                  </>
                )}
              </p>
              <div className="inline-flex rounded-full border border-white/10 bg-navy-950/60 p-1" role="group" aria-label="Result view">
                {(
                  [
                    { key: "list", label: "List", Icon: List },
                    { key: "map", label: "Map", Icon: MapIcon },
                  ] as const
                ).map(({ key, label, Icon }) => (
                  <Link
                    key={key}
                    href={buildHref(query, { view: key, offset })}
                    aria-current={query.view === key ? "page" : undefined}
                    className={cn("inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition", query.view === key ? "bg-gold-400 text-navy-950" : "text-ivory-300 hover:text-ivory-50")}
                  >
                    <Icon size={14} aria-hidden /> {label}
                  </Link>
                ))}
              </div>
            </div>

            {page.length === 0 ? (
              <EmptyState
                title="No memorials match"
                body="Try a shorter name, check the spelling, or remove a year. If they are not here yet, you could be the one to create their memorial."
                action={
                  <Link href="/create" className="btn-primary">
                    Create a Memorial
                  </Link>
                }
              />
            ) : query.view === "map" ? (
              <SearchMapView results={page} />
            ) : (
              <ul className="grid gap-4 md:grid-cols-2">
                {page.map((r) => (
                  <li key={r.id}>
                    <SearchResultCard r={r} />
                  </li>
                ))}
              </ul>
            )}

            {(offset > 0 || hasMore) && (
              <nav aria-label="Pagination" className="mt-8 flex items-center justify-between">
                {offset > 0 ? (
                  <Link href={buildHref(query, { offset: Math.max(0, offset - LIMIT) })} className="btn-secondary">
                    <ChevronLeft size={16} aria-hidden /> Previous
                  </Link>
                ) : (
                  <span />
                )}
                {hasMore && (
                  <Link href={buildHref(query, { offset: offset + LIMIT })} className="btn-secondary">
                    Next <ChevronRight size={16} aria-hidden />
                  </Link>
                )}
              </nav>
            )}
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
