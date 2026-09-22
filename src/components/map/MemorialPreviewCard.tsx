import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { lifeYears, truncate } from "@/lib/format";

export function MemorialPreviewCard({
  slug,
  name,
  birthYear,
  deathYear,
  epitaph,
  imagePath,
  memorialType,
  isDemo,
  placeName,
}: {
  slug: string;
  name: string;
  birthYear: number | null;
  deathYear: number | null;
  epitaph: string | null;
  imagePath: string | null;
  memorialType?: string;
  isDemo?: boolean;
  placeName?: string | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Avatar path={imagePath} name={name} size={64} />
        <div className="min-w-0">
          <p className="truncate font-display text-2xl leading-tight text-ivory-50">{name}</p>
          <p className="text-sm text-gold-300">{lifeYears(birthYear, deathYear, memorialType)}</p>
          {placeName && <p className="truncate text-xs text-ivory-500">{placeName}</p>}
        </div>
      </div>
      {epitaph && <p className="font-display text-lg italic text-ivory-200">“{truncate(epitaph, 140)}”</p>}
      {isDemo && <p className="text-[10px] uppercase tracking-widest text-ivory-500">Demonstration memorial</p>}
      <Link href={`/memorial/${slug}`} className="btn-primary w-full">
        Visit Memorial
      </Link>
    </div>
  );
}
