import Link from "next/link";
import type { ReactNode } from "react";
import { MapPin, Heart, MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { imageUrl } from "@/lib/storage";
import { lifeYears, truncate, compactNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export type MemorialCardProps = {
  slug: string;
  name: string;
  birthYear: number | null;
  deathYear: number | null;
  epitaph?: string | null;
  placeName?: string | null;
  profileImagePath?: string | null;
  coverImagePath?: string | null;
  memorialType?: string;
  tributesCount?: number | null;
  memoriesCount?: number | null;
  href?: string;
  /** Optional row rendered under the body (e.g. a "saved 3d ago" note). */
  footer?: ReactNode;
  className?: string;
};

/**
 * Elegant memorial card used on the homepage showcase, saved list and search.
 * A soft gradient cover (or the memorial's own cover image), the person's
 * portrait, their name and years, place and a short epitaph excerpt.
 */
export function MemorialCard({
  slug,
  name,
  birthYear,
  deathYear,
  epitaph,
  placeName,
  profileImagePath,
  coverImagePath,
  memorialType,
  tributesCount,
  memoriesCount,
  href,
  footer,
  className,
}: MemorialCardProps) {
  const cover = imageUrl(coverImagePath, { width: 800, height: 400, quality: 75 });
  const years = lifeYears(birthYear, deathYear, memorialType);
  return (
    <article className={cn("card group relative flex flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-0.5", className)}>
      <div className="relative h-24 w-full overflow-hidden bg-gradient-to-br from-navy-700 via-navy-800 to-gold-700/30" aria-hidden>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-full w-full object-cover opacity-80 transition-opacity duration-500 group-hover:opacity-100" loading="lazy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-800 via-navy-800/20 to-transparent" />
      </div>
      <div className="-mt-8 flex flex-1 flex-col px-5 pb-5">
        <Avatar path={profileImagePath} name={name} size={64} className="ring-4 ring-navy-800" />
        <h3 className="mt-3 text-2xl leading-tight text-ivory-50">
          <Link href={href ?? `/memorial/${slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {name}
          </Link>
        </h3>
        {years && <p className="text-sm text-gold-300">{years}</p>}
        {placeName && (
          <p className="mt-1 flex items-center gap-1 text-xs text-ivory-500">
            <MapPin size={12} aria-hidden /> <span className="truncate">{placeName}</span>
          </p>
        )}
        {epitaph && <p className="mt-3 font-display text-lg italic leading-snug text-ivory-200">“{truncate(epitaph, 110)}”</p>}
        {(tributesCount != null || memoriesCount != null) && (
          <p className="mt-auto flex items-center gap-4 pt-4 text-xs text-ivory-500">
            {tributesCount != null && (
              <span className="inline-flex items-center gap-1">
                <Heart size={12} aria-hidden /> {compactNumber(tributesCount)} <span className="sr-only">tributes</span>
              </span>
            )}
            {memoriesCount != null && (
              <span className="inline-flex items-center gap-1">
                <MessageCircle size={12} aria-hidden /> {compactNumber(memoriesCount)} <span className="sr-only">memories</span>
              </span>
            )}
          </p>
        )}
        {footer && <div className="relative z-10 mt-3">{footer}</div>}
      </div>
    </article>
  );
}
