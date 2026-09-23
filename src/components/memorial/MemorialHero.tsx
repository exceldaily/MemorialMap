import Image from "next/image";
import { Avatar } from "@/components/ui/Avatar";
import type { HeroLayout } from "@/lib/appearance";
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
  layout = "centered",
}: {
  memorial: Memorial;
  isSaved: boolean;
  signedIn: boolean;
  canManage: boolean;
  layout?: HeroLayout;
}) {
  const cover = imageUrl(memorial.cover_image_path, { width: 1800, quality: 80 });
  const years = lifeYears(memorial.birth_year, memorial.death_year, memorial.memorial_type);
  const accent = memorial.accent_color ?? undefined;

  const coverLayer = cover ? (
    <Image src={cover} alt="" fill priority unoptimized sizes="100vw" className="object-cover object-center animate-fade-in" />
  ) : (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        background: `radial-gradient(120% 90% at 50% 110%, ${accent ?? "rgb(211 184 119 / 0.28)"} 0%, transparent 55%), radial-gradient(70% 60% at 15% 0%, rgb(138 168 138 / 0.18) 0%, transparent 60%), linear-gradient(180deg, var(--color-navy-800) 0%, var(--color-navy-900) 100%)`,
      }}
    />
  );

  const demoBadge = memorial.is_demo && (
    <span className="absolute left-4 top-4 z-10 rounded-full border border-white/15 bg-navy-950/60 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-ivory-300 backdrop-blur">
      Demonstration memorial
    </span>
  );

  const actions = <HeroActions memorialId={memorial.id} slug={memorial.slug} name={memorial.full_name} url={memorialUrl(memorial.slug)} isSaved={isSaved} signedIn={signedIn} canManage={canManage} />;

  const yearsLabel = memorial.memorial_type === "living" ? "Born" : "Years";

  /* ---- Full cover: tall photo, name across the bottom ------------------ */
  if (layout === "cover") {
    return (
      <header className="relative">
        <div className="relative h-[62vh] min-h-[420px] max-h-[720px] w-full overflow-hidden bg-navy-950">
          {coverLayer}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/65 to-navy-950/10" />
          {demoBadge}
          <div className="container-page absolute inset-x-0 bottom-0 pb-8 sm:pb-10">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-end sm:gap-6">
              <div className="shrink-0 rounded-full bg-navy-900 p-1.5 shadow-soft">
                <Avatar path={memorial.profile_image_path} name={memorial.full_name} size={120} priority className="ring-[3px] ring-gold-400/60" />
              </div>
              <div className="min-w-0 pb-1">
                <h1 className="max-w-4xl text-4xl leading-[1.05] text-ivory-50 sm:text-5xl md:text-6xl animate-fade-up">{memorial.full_name}</h1>
                {years && (
                  <p className="mt-2 font-display text-xl tracking-wide text-gold-300 sm:text-2xl" aria-label={yearsLabel}>
                    {years}
                  </p>
                )}
                {memorial.nickname && <p className="mt-1 text-sm text-ivory-400">&ldquo;Known as {memorial.nickname}&rdquo;</p>}
              </div>
            </div>
          </div>
        </div>
        <div className="container-page mt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          {memorial.epitaph ? <p className="max-w-2xl font-display text-2xl italic leading-snug text-ivory-200 sm:text-3xl">&ldquo;{memorial.epitaph}&rdquo;</p> : <span />}
          <div className="shrink-0">{actions}</div>
        </div>
      </header>
    );
  }

  /* ---- Side by side: large portrait beside the name -------------------- */
  if (layout === "split") {
    const portrait = imageUrl(memorial.profile_image_path, { width: 900, quality: 85 });
    return (
      <header className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-navy-950">
          <div className="absolute inset-0 opacity-45">{coverLayer}</div>
          <div className="absolute inset-0 bg-gradient-to-b from-navy-950/40 via-navy-900/80 to-navy-900" />
        </div>
        {demoBadge}
        <div className="container-page relative grid gap-8 py-12 sm:py-16 md:grid-cols-[minmax(0,20rem)_1fr] md:items-center md:gap-12">
          <div className="mx-auto w-full max-w-[20rem]">
            {portrait ? (
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-soft ring-[3px] ring-gold-400/60 animate-fade-in">
                <Image src={portrait} alt={`Portrait of ${memorial.full_name}`} fill priority unoptimized sizes="(min-width: 768px) 20rem, 80vw" className="object-cover" />
              </div>
            ) : (
              <div className="flex justify-center">
                <Avatar path={null} name={memorial.full_name} size={220} className="ring-[3px] ring-gold-400/60" />
              </div>
            )}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl leading-[1.05] text-ivory-50 sm:text-5xl md:text-6xl animate-fade-up">{memorial.full_name}</h1>
            {years && (
              <p className="mt-2 font-display text-xl tracking-wide text-gold-300 sm:text-2xl" aria-label={yearsLabel}>
                {years}
              </p>
            )}
            {memorial.nickname && <p className="mt-1 text-sm text-ivory-400">&ldquo;Known as {memorial.nickname}&rdquo;</p>}
            {memorial.epitaph && <p className="mt-5 max-w-2xl font-display text-2xl italic leading-snug text-ivory-200 sm:text-3xl">&ldquo;{memorial.epitaph}&rdquo;</p>}
            <div className="mt-7 flex justify-center md:justify-start">{actions}</div>
          </div>
        </div>
      </header>
    );
  }

  /* ---- Portrait (default): round portrait centred under the cover ------ */
  return (
    <header className="relative">
      <div className="relative h-[42vh] min-h-[280px] max-h-[520px] w-full overflow-hidden bg-navy-950">
        {coverLayer}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/55 to-navy-950/25" />
        {demoBadge}
      </div>

      <div className="container-page relative -mt-[72px] flex flex-col items-center text-center">
        <div className="rounded-full bg-navy-900 p-1.5 shadow-soft">
          <Avatar path={memorial.profile_image_path} name={memorial.full_name} size={144} priority className="ring-[3px] ring-gold-400/60" />
        </div>
        <h1 className="mt-5 max-w-3xl text-4xl leading-[1.05] text-ivory-50 sm:text-5xl md:text-6xl animate-fade-up">{memorial.full_name}</h1>
        {years && (
          <p className="mt-2 font-display text-xl tracking-wide text-gold-300 sm:text-2xl" aria-label={yearsLabel}>
            {years}
          </p>
        )}
        {memorial.nickname && <p className="mt-1 text-sm text-ivory-400">&ldquo;Known as {memorial.nickname}&rdquo;</p>}
        {memorial.epitaph && (
          <p className="mt-5 max-w-2xl font-display text-2xl italic leading-snug text-ivory-200 sm:text-3xl">
            &ldquo;{memorial.epitaph}&rdquo;
          </p>
        )}
        <div className="mt-7">{actions}</div>
      </div>
    </header>
  );
}
