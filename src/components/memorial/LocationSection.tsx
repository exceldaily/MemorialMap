"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ExternalLink, MapPin } from "lucide-react";
import { formatCoord } from "@/lib/format";
import { LOCATION_DISCLAIMER_FULL } from "@/lib/site";
import type { MemorialLocation } from "@/lib/supabase/types";
import { SectionHeading } from "./SectionHeading";

const MemorialMap = dynamic(() => import("@/components/map/MemorialMap").then((m) => m.MemorialMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-navy-950/60" aria-hidden />,
});

/**
 * "Digital Memorial Location" — a virtual marker on the world map.
 * Never describes the point as a physical or burial location.
 */
export function LocationSection({ location, slug, restingPlace }: { location: MemorialLocation | null; slug: string; restingPlace: string | null }) {
  if (!location && !restingPlace) return null;

  return (
    <section id="location" aria-labelledby="location-heading" className="scroll-mt-32">
      <SectionHeading id="location-heading" eyebrow="On the map" title="Digital Memorial Location" />

      {location ? (
        <div className="card overflow-hidden">
          <div className="relative h-[260px] w-full">
            <MemorialMap
              className="h-full w-full"
              mode="explore"
              showMemorials={false}
              selectedPoint={{ lat: location.latitude, lng: location.longitude }}
              initialCenter={{ lat: location.latitude, lng: location.longitude }}
              initialZoom={12}
              interactive
              showControls={false}
              cooperativeGestures
            />
          </div>
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-400/15 text-gold-300" aria-hidden>
                <MapPin size={18} />
              </span>
              <div className="min-w-0">
                {location.place_name && <p className="truncate font-display text-xl text-ivory-50">{location.place_name}</p>}
                <p className="text-xs tracking-wide text-ivory-400">
                  {formatCoord(location.latitude, "lat")} · {formatCoord(location.longitude, "lng")}
                </p>
              </div>
            </div>
            <Link
              href={`/map?lat=${location.latitude}&lng=${location.longitude}&z=15&focus=${encodeURIComponent(slug)}`}
              className="btn-secondary shrink-0"
            >
              Open on the Memorial Map
              <ExternalLink size={14} aria-hidden />
            </Link>
          </div>
        </div>
      ) : null}

      {restingPlace && (
        <p className="mt-4 text-sm text-ivory-300">
          <span className="font-medium text-ivory-100">Actual resting place:</span> {restingPlace}
        </p>
      )}

      <p className="mt-4 text-xs leading-relaxed text-ivory-500">{LOCATION_DISCLAIMER_FULL}</p>
    </section>
  );
}
