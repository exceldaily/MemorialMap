"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import type { ChosenLocation } from "@/components/map/LocationPicker";
import { Avatar } from "@/components/ui/Avatar";
import { formatCoord, lifeYears, truncate } from "@/lib/format";
import { LOCATION_DISCLAIMER_SHORT } from "@/lib/site";
import { imageUrl } from "@/lib/storage";
import type { MemorialType, PrivacyLevel } from "@/lib/supabase/types";
import { PRIVACY_OPTIONS } from "./PrivacyOptions";

const MemorialMap = dynamic(() => import("@/components/map/MemorialMap").then((m) => m.MemorialMap), { ssr: false });

/**
 * Faithful, read-only preview of how the memorial page will appear.
 */
export function MemorialPreview({
  name,
  nickname,
  birthYear,
  deathYear,
  memorialType,
  epitaph,
  biography,
  profilePath,
  coverPath,
  location,
  privacy,
  restingPlace,
}: {
  name: string;
  nickname?: string | null;
  birthYear: number | null;
  deathYear: number | null;
  memorialType: MemorialType;
  epitaph: string;
  biography: string | null;
  profilePath: string | null;
  coverPath: string | null;
  location: ChosenLocation | null;
  privacy: PrivacyLevel;
  restingPlace?: string | null;
}) {
  const cover = imageUrl(coverPath, { width: 1600, quality: 80 });
  const years = lifeYears(birthYear, deathYear, memorialType);
  const privacyMeta = PRIVACY_OPTIONS.find((p) => p.value === privacy);

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-navy-900 shadow-soft" aria-label="Memorial preview">
      <div className="relative h-44 sm:h-56">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_top,rgba(211,184,119,0.25),transparent_60%),linear-gradient(180deg,#1a2538,#0b1220)]" aria-hidden />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/40 to-transparent" aria-hidden />
        {privacyMeta && (
          <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-navy-950/70 px-3 py-1 text-xs text-ivory-200 backdrop-blur">
            <privacyMeta.Icon size={12} aria-hidden /> {privacyMeta.title}
          </span>
        )}
      </div>

      <div className="px-5 pb-6 sm:px-8">
        <div className="-mt-14 flex flex-col items-center text-center sm:-mt-16">
          <Avatar path={profilePath} name={name || "Memorial"} size={120} className="ring-4 ring-navy-900" />
          {memorialType === "living" ? <p className="eyebrow mt-4">Living memorial</p> : <p className="eyebrow mt-4">In loving memory of</p>}
          <h2 className="mt-1 text-3xl text-ivory-50 sm:text-4xl">{name || "Their name"}</h2>
          {nickname && <p className="text-sm italic text-ivory-400">&ldquo;{nickname}&rdquo;</p>}
          {years && <p className="mt-1 font-display text-lg text-gold-300">{years}</p>}
          <p className="mt-3 max-w-md font-display text-xl italic text-ivory-200">{epitaph}</p>
        </div>

        <div className="divider my-6" />

        {biography ? (
          <p className="prose-memorial text-center sm:text-left">{truncate(biography, 420)}</p>
        ) : (
          <p className="text-center text-sm text-ivory-500">Their story will appear here. You can add it now or after publishing.</p>
        )}

        {restingPlace && (
          <p className="mt-4 text-sm text-ivory-400">
            <span className="text-ivory-500">Resting place:</span> {restingPlace}
          </p>
        )}

        <div className="mt-6 rounded-2xl border border-white/10 bg-navy-950/50 p-4">
          <div className="flex items-start gap-3">
            <MapPin size={18} className="mt-0.5 shrink-0 text-gold-400" aria-hidden />
            <div className="min-w-0 flex-1 text-sm">
              <p className="eyebrow">Memorial Location</p>
              {location ? (
                <>
                  <p className="mt-1 text-ivory-100">{location.placeName ?? "Approximate place name unavailable"}</p>
                  <p className="text-xs text-ivory-500">
                    {formatCoord(location.lat, "lat")} · {formatCoord(location.lng, "lng")}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-ivory-400">No location chosen yet.</p>
              )}
            </div>
          </div>
          {location && (
            <div className="mt-3 h-40 overflow-hidden rounded-xl border border-white/10">
              <MemorialMap
                mode="explore"
                interactive={false}
                showMemorials={false}
                showControls={false}
                selectedPoint={{ lat: location.lat, lng: location.lng }}
                initialCenter={{ lat: location.lat, lng: location.lng }}
                initialZoom={13}
                className="h-full w-full"
              />
            </div>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-ivory-500">{LOCATION_DISCLAIMER_SHORT}</p>
        </div>
      </div>
    </article>
  );
}
