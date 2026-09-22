import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { MemorialHero } from "@/components/memorial/MemorialHero";
import { SectionNav, type SectionLink } from "@/components/memorial/SectionNav";
import { LocationSection } from "@/components/memorial/LocationSection";
import { StorySection, hasStory } from "@/components/memorial/StorySection";
import { PhotoGallery } from "@/components/memorial/PhotoGallery";
import { VideoSection, toEmbedUrl } from "@/components/memorial/VideoSection";
import { MemoriesSection } from "@/components/memorial/MemoriesSection";
import { TimelineSection } from "@/components/memorial/TimelineSection";
import { FamilySection } from "@/components/memorial/FamilySection";
import { TributeBar } from "@/components/memorial/TributeBar";
import { recordView } from "@/lib/actions/engagement";
import { getMemorialBySlug, canManageRole } from "@/lib/queries/memorial";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { lifeYears, truncate } from "@/lib/format";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { publicUrl } from "@/lib/storage";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await getMemorialBySlug(slug);
  if (!bundle || bundle.memorial.status === "removed") {
    return { title: "Memorial not found", robots: { index: false, follow: false } };
  }
  const m = bundle.memorial;
  const years = lifeYears(m.birth_year, m.death_year, m.memorial_type).replace(" – ", "–");
  const title = years ? `${m.full_name} (${years}) | ${SITE_NAME}` : `${m.full_name} | ${SITE_NAME}`;
  const description = truncate(m.biography || m.epitaph || `A memorial for ${m.full_name} on ${SITE_NAME}.`, 160);
  const url = `${SITE_URL}/memorial/${m.slug}`;
  const indexable = m.privacy === "public" && m.status === "published";
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "profile",
      siteName: SITE_NAME,
      images: [{ url: `/memorial/${m.slug}/opengraph-image`, width: 1200, height: 630, alt: `${m.full_name} — ${SITE_NAME}` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [`/memorial/${m.slug}/opengraph-image`] },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function MemorialPage({ params }: Props) {
  const { slug } = await params;
  const bundle = await getMemorialBySlug(slug);
  if (!bundle || bundle.memorial.status === "removed") notFound();

  const { memorial, location, photos, videos, timeline, memories, family, familyGroup, tributeCounts, viewerRole, isSaved, viewerId } = bundle;
  const canManage = canManageRole(viewerRole);

  if (memorial.status === "suspended" && !canManage) {
    return <SuspendedNotice />;
  }

  if (!canManage) void recordView(slug);

  let authorName: string | null = null;
  if (viewerId) {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from("profiles").select("display_name").eq("id", viewerId).maybeSingle();
    authorName = data?.display_name ?? null;
  }

  const visiblePhotos = photos.filter((p) => p.status === "approved" || (canManage && p.status === "pending"));
  const visibleVideos = videos.filter((v) => (v.status === "approved" || (canManage && v.status === "pending")) && (v.storage_path || (v.external_url && toEmbedUrl(v.external_url))));

  const sections: SectionLink[] = [];
  if (location || memorial.resting_place) sections.push({ id: "location", label: "Location" });
  if (hasStory(memorial)) sections.push({ id: "story", label: "Life Story" });
  if (visiblePhotos.length) sections.push({ id: "photos", label: "Photos" });
  if (visibleVideos.length) sections.push({ id: "videos", label: "Videos" });
  sections.push({ id: "memories", label: "Memories" });
  if (timeline.length) sections.push({ id: "timeline", label: "Timeline" });
  if (family.length || familyGroup) sections.push({ id: "family", label: "Family" });
  sections.push({ id: "tributes", label: "Tributes" });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: memorial.full_name,
    ...(memorial.nickname ? { alternateName: memorial.nickname } : {}),
    ...(memorial.birth_date ? { birthDate: memorial.birth_date } : memorial.birth_year ? { birthDate: String(memorial.birth_year) } : {}),
    ...(memorial.death_date ? { deathDate: memorial.death_date } : memorial.death_year ? { deathDate: String(memorial.death_year) } : {}),
    ...(memorial.profile_image_path ? { image: publicUrl(memorial.profile_image_path) } : {}),
    ...(memorial.biography ? { description: truncate(memorial.biography, 300) } : {}),
    url: `${SITE_URL}/memorial/${memorial.slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <main className="min-h-screen">
        {memorial.status === "draft" && (
          <p className="border-b border-gold-400/20 bg-gold-400/10 px-4 py-2 text-center text-xs text-gold-300">
            This memorial is a draft — only you and the people you invite can see it.{" "}
            <Link href={`/memorial/${memorial.slug}/edit`} className="underline">
              Continue editing
            </Link>
          </p>
        )}
        {memorial.status === "suspended" && (
          <p className="border-b border-danger-500/30 bg-danger-500/10 px-4 py-2 text-center text-xs text-danger-400">
            This memorial is currently under review and hidden from visitors.{memorial.suspended_reason ? ` Reason: ${memorial.suspended_reason}` : ""}
          </p>
        )}
        {memorial.privacy !== "public" && memorial.status === "published" && canManage && (
          <p className="border-b border-white/5 bg-white/3 px-4 py-2 text-center text-xs text-ivory-400">
            {memorial.privacy === "unlisted" ? "Unlisted — visible only to people with the link." : "Private — visible only to the family."}
          </p>
        )}

        <MemorialHero memorial={memorial} isSaved={isSaved} signedIn={Boolean(viewerId)} canManage={canManage} />

        <div className="mt-10">
          <SectionNav sections={sections} />
        </div>

        <div className="container-page space-y-20 py-12 sm:space-y-24 sm:py-16">
          <LocationSection location={location} slug={memorial.slug} restingPlace={memorial.resting_place} />
          <StorySection memorial={memorial} />
          <PhotoGallery photos={visiblePhotos} name={memorial.full_name} />
          <VideoSection videos={visibleVideos} name={memorial.full_name} />
          <MemoriesSection memorialId={memorial.id} slug={memorial.slug} name={memorial.first_name} initialMemories={memories} viewerId={viewerId} canManage={canManage} authorName={authorName} />
          <TimelineSection events={timeline} />
          <FamilySection family={family} familyGroup={familyGroup} />
          <TributeBar memorialId={memorial.id} initialCounts={tributeCounts} signedIn={Boolean(viewerId)} />
        </div>
      </main>
      <Footer />
    </>
  );
}

function SuspendedNotice() {
  return (
    <>
      <main className="container-page flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 h-12 w-12 rounded-full border border-gold-400/40 bg-gold-400/10" aria-hidden />
        <h1 className="text-4xl text-ivory-50">This memorial is under review</h1>
        <p className="mt-3 max-w-md text-ivory-400">It is temporarily unavailable while our team looks into it. Thank you for your patience.</p>
        <div className="mt-8 flex gap-3">
          <Link href="/map" className="btn-primary">
            Explore the Memorial Map
          </Link>
          <Link href="/search" className="btn-secondary">
            Search memorials
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
