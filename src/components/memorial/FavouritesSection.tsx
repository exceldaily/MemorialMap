import type { MemorialFavourite } from "@/lib/appearance";
import { MOTIF_ICONS } from "./motifs";
import { SectionHeading } from "./SectionHeading";

/** Favourite things as tiles: the songs, places, teams and small joys that made up their world. */
export function FavouritesSection({ favourites, firstName }: { favourites: MemorialFavourite[]; firstName: string }) {
  if (!favourites.length) return null;
  return (
    <section id="favourites" aria-labelledby="favourites-heading" className="scroll-mt-32">
      <SectionHeading id="favourites-heading" eyebrow={`${firstName}'s world`} title="Favourite Things" />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {favourites.map((f, i) => {
          const Icon = MOTIF_ICONS[f.icon];
          return (
            <li key={`${f.label}-${i}`} className="card flex items-start gap-3 p-4 transition hover:border-gold-400/40">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-400/15 text-gold-400" aria-hidden>
                <Icon size={18} strokeWidth={1.8} />
              </span>
              <div className="min-w-0">
                <p className="label mb-0.5">{f.label}</p>
                <p className="font-display text-lg leading-snug text-ivory-50">{f.value}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
