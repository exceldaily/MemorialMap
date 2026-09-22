import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Users } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { FamilyMap } from "@/components/memorial/FamilyMap";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { imageUrl } from "@/lib/storage";
import { lifeYears, truncate } from "@/lib/format";
import { LOCATION_DISCLAIMER_FULL, SITE_NAME, SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

async function loadGroup(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data: group } = await supabase.from("family_groups").select("*").eq("slug", slug).maybeSingle();
  if (!group) return null;
  const { data: members } = await supabase
    .from("memorials")
    .select("id, slug, full_name, nickname, birth_year, death_year, epitaph, profile_image_path, memorial_type, is_demo")
    .eq("family_group_id", group.id)
    .eq("status", "published")
    .order("birth_year", { ascending: true, nullsFirst: false });
  const ids = (members ?? []).map((m) => m.id);
  const { data: locations } = ids.length ? await supabase.from("memorial_locations").select("memorial_id, latitude, longitude, place_name").in("memorial_id", ids) : { data: [] };
  const locMap = new Map((locations ?? []).map((l) => [l.memorial_id, l]));
  return {
    group,
    members: (members ?? []).map((m) => ({ ...m, location: locMap.get(m.id) ?? null })),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadGroup(slug);
  if (!data) return { title: "Family not found", robots: { index: false, follow: false } };
  const { group, members } = data;
  const description = truncate(group.description || `${group.name} — ${members.length} ${members.length === 1 ? "memorial" : "memorials"} on ${SITE_NAME}.`, 160);
  return {
    title: group.name,
    description,
    alternates: { canonical: `${SITE_URL}/family/${group.slug}` },
    openGraph: { title: `${group.name} | ${SITE_NAME}`, description, url: `${SITE_URL}/family/${group.slug}`, type: "website" },
    robots: group.privacy === "public" ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function FamilyGroupPage({ params }: Props) {
  const { slug } = await params;
  const data = await loadGroup(slug);
  if (!data) notFound();
  const { group, members } = data;
  const cover = imageUrl(group.cover_image_path, { width: 1800, quality: 80 });
  const first = members.find((m) => m.location);
  const center = first?.location ? { lat: first.location.latitude, lng: first.location.longitude } : null;

  return (
    <>
      <main>
        <header className="relative">
          <div className="relative h-[34vh] min-h-[220px] max-h-[420px] w-full overflow-hidden bg-navy-950">
            {cover ? (
              <Image src={cover} alt="" fill priority unoptimized sizes="100vw" className="object-cover" />
            ) : (
              <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(110% 80% at 50% 110%, rgb(138 168 138 / 0.28) 0%, transparent 55%), linear-gradient(180deg, #111a2c 0%, #0b1220 100%)" }} />
            )}
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/50 to-transparent" />
            {group.is_demo && (
              <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-navy-950/60 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-ivory-300 backdrop-blur">
                Demonstration family
              </span>
            )}
          </div>
          <div className="container-page relative -mt-14 flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sage-500/20 text-sage-300 ring-4 ring-navy-900" aria-hidden>
              <Users size={26} />
            </span>
            <p className="eyebrow mt-5">Family memorial area</p>
            <h1 className="mt-2 text-4xl text-ivory-50 sm:text-5xl">{group.name}</h1>
            {group.description && <p className="mt-4 max-w-2xl whitespace-pre-line leading-relaxed text-ivory-300">{group.description}</p>}
            <p className="mt-3 text-sm text-ivory-500">
              {members.length} {members.length === 1 ? "memorial" : "memorials"}
            </p>
          </div>
        </header>

        <div className="container-page space-y-16 py-12 sm:py-16">
          {center && (
            <section aria-labelledby="family-map-heading">
              <h2 id="family-map-heading" className="mb-4 text-3xl text-ivory-50">
                Family memorial locations
              </h2>
              <div className="card overflow-hidden">
                <div className="relative h-[360px] w-full sm:h-[440px]">
                  <FamilyMap familyGroupId={group.id} center={center} zoom={15} />
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-ivory-500">{LOCATION_DISCLAIMER_FULL}</p>
            </section>
          )}

          <section aria-labelledby="family-members-heading">
            <h2 id="family-members-heading" className="mb-6 text-3xl text-ivory-50">
              Memorials
            </h2>
            {members.length === 0 ? (
              <EmptyState title="No memorials yet" body="Memorials added to this family will appear here once they are published." />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((m) => (
                  <li key={m.id}>
                    <Link href={`/memorial/${m.slug}`} className="card flex h-full flex-col gap-4 p-5 transition hover:border-sage-400/40 hover:bg-navy-700/70">
                      <div className="flex items-center gap-4">
                        <Avatar path={m.profile_image_path} name={m.full_name} size={64} className="ring-sage-400/50" />
                        <div className="min-w-0">
                          <p className="truncate font-display text-2xl leading-tight text-ivory-50">{m.full_name}</p>
                          <p className="text-sm text-gold-300">{lifeYears(m.birth_year, m.death_year, m.memorial_type)}</p>
                          {m.location?.place_name && (
                            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-ivory-500">
                              <MapPin size={11} aria-hidden /> {m.location.place_name}
                            </p>
                          )}
                        </div>
                      </div>
                      {m.epitaph && <p className="font-display text-lg italic text-ivory-300">&ldquo;{truncate(m.epitaph, 120)}&rdquo;</p>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
