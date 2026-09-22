import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MemorialCard } from "@/components/cards/MemorialCard";

type Row = {
  id: string;
  slug: string;
  full_name: string;
  birth_year: number | null;
  death_year: number | null;
  epitaph: string;
  profile_image_path: string | null;
  cover_image_path: string | null;
  memorial_type: string;
  tributes_count: number;
  memories_count: number;
  memorial_locations: { place_name: string | null }[] | { place_name: string | null } | null;
};

function placeOf(r: Row) {
  const loc = r.memorial_locations;
  if (!loc) return null;
  return Array.isArray(loc) ? (loc[0]?.place_name ?? null) : loc.place_name;
}

/** Server component: the six most recently published public memorials. */
export async function RecentMemorials() {
  let rows: Row[] = [];
  let failed = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("memorials")
      .select(
        "id, slug, full_name, birth_year, death_year, epitaph, profile_image_path, cover_image_path, memorial_type, tributes_count, memories_count, memorial_locations(place_name)",
      )
      .eq("status", "published")
      .eq("privacy", "public")
      .order("published_at", { ascending: false })
      .limit(6);
    if (error) failed = true;
    rows = (data as unknown as Row[] | null) ?? [];
  } catch {
    failed = true;
  }
  if (failed || rows.length === 0) return null;

  return (
    <section aria-labelledby="recent-memorials" className="container-page py-20 sm:py-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Recent memorials</p>
          <h2 id="recent-memorials" className="mt-3 text-4xl text-ivory-50 sm:text-5xl">
            Lives recently remembered
          </h2>
        </div>
        <Link href="/search" className="btn-ghost">
          Search all memorials <ArrowRight size={16} aria-hidden />
        </Link>
      </div>
      <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((r) => (
          <li key={r.id}>
            <MemorialCard
              slug={r.slug}
              name={r.full_name}
              birthYear={r.birth_year}
              deathYear={r.death_year}
              epitaph={r.epitaph}
              placeName={placeOf(r)}
              profileImagePath={r.profile_image_path}
              coverImagePath={r.cover_image_path}
              memorialType={r.memorial_type}
              tributesCount={r.tributes_count}
              memoriesCount={r.memories_count}
              className="h-full"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
