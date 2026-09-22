import Image from "next/image";
import { Avatar } from "@/components/ui/Avatar";
import { imageUrl } from "@/lib/storage";
import { lifeYears } from "@/lib/format";
import { memorialUrl } from "@/lib/site";
import type { Memorial } from "@/lib/supabase/types";
import { HeroActions } from "./HeroActions";

export function MemorialHero({
  memorial,
  isSaved,
  signedIn,
  canManage,
}: {
  memorial: Memorial;
  isSaved: boolean;
  signedIn: boolean;
  canManage: boolean;
}) {
  const cover = imageUrl(memorial.cover_image_path, { width: 1800, quality: 80 });
  const years = lifeYears(memorial.birth_year, memorial.death_year, memorial.memorial_type);
  const accent = memorial.accent_color ?? undefined;

  return (
    <header className="relative">
      {/* Cover ------------------------------------------------------- */}
      <div className="relative h-[42vh] min-h-[280px] max-h-[520px] w-full overflow-hidden bg-navy-950">
        {cover ? (
          <Image src={cover} alt="" fill priority unoptimized sizes="100vw" className="object-cover object-center animate-fade-in" />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: `radial-gradient(120% 90% at 50% 110%, ${accent ?? "rgb(211 184 119 / 0.28)"} 0%, transparent 55%), radial-gradient(70% 60% at 15% 0%, rgb(138 168 138 / 0.18) 0%, transparent 60%), linear-gradient(180deg, #111a2c 0%, #0b1220 100%)`,
            }}
          />
        )}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/55 to-navy-950/25" />
        {memorial.is_demo && (
          <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-navy-950/60 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-ivory-300 backdrop-blur">
            Demonstration memorial
          </span>
        )}
      </div>

      {/* Identity ---------------------------------------------------- */}
      <div className="container-page relative -mt-[72px] flex flex-col items-center text-center">
        <div className="rounded-full bg-navy-900 p-1.5 shadow-soft">
          <Avatar path={memorial.profile_image_path} name={memorial.full_name} size={144} priority className="ring-[3px] ring-gold-400/60" />
        </div>
        <h1 className="mt-5 max-w-3xl text-4xl leading-[1.05] text-ivory-50 sm:text-5xl md:text-6xl animate-fade-up">{memorial.full_name}</h1>
        {years && (
          <p className="mt-2 font-display text-xl tracking-wide text-gold-300 sm:text-2xl" aria-label={memorial.memorial_type === "living" ? "Born" : "Years"}>
            {years}
          </p>
        )}
        {memorial.nickname && <p className="mt-1 text-sm text-ivory-400">&ldquo;Known as {memorial.nickname}&rdquo;</p>}
        {memorial.epitaph && (
          <p className="mt-5 max-w-2xl font-display text-2xl italic leading-snug text-ivory-200 sm:text-3xl">
            &ldquo;{memorial.epitaph}&rdquo;
          </p>
        )}
        <div className="mt-7">
          <HeroActions memorialId={memorial.id} slug={memorial.slug} name={memorial.full_name} url={memorialUrl(memorial.slug)} isSaved={isSaved} signedIn={signedIn} canManage={canManage} />
        </div>
      </div>
    </header>
  );
}
