"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { MapFeatureMemorial, SearchResult } from "@/lib/supabase/types";
import type { MapStyleKey, MemorialMapHandle, MapPoint } from "./MemorialMap";
import { MapSearch } from "./MapSearch";
import { MapStyleSwitcher } from "./MapStyleSwitcher";
import { MemorialPreviewCard } from "./MemorialPreviewCard";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { compactNumber } from "@/lib/format";

const MemorialMap = dynamic(() => import("./MemorialMap").then((m) => m.MemorialMap), { ssr: false });

type Selected = { m: MapFeatureMemorial; point: MapPoint };

export function ExploreMap() {
  const router = useRouter();
  const sp = useSearchParams();
  const mapRef = useRef<MemorialMapHandle>(null);
  const [style, setStyle] = useState<MapStyleKey>("dark");
  const [selected, setSelected] = useState<Selected | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ total: number; truncated: boolean } | null>(null);

  const initial = {
    lat: Number(sp.get("lat")) || 24,
    lng: Number(sp.get("lng")) || 8,
    zoom: Number(sp.get("z")) || 1.6,
  };
  const focusSlug = sp.get("focus");

  // Fly to a memorial when linked with ?focus=slug
  useEffect(() => {
    if (!focusSlug) return;
    fetch(`/api/search?q=${encodeURIComponent(focusSlug.replace(/-/g, " "))}&limit=5`)
      .then((r) => r.json())
      .then((j) => {
        const m = (j.results as SearchResult[] | undefined)?.find((r) => r.slug === focusSlug);
        if (m?.latitude != null && m.longitude != null) mapRef.current?.flyTo({ lat: m.latitude, lng: m.longitude }, 14);
      })
      .catch(() => undefined);
  }, [focusSlug]);

  const onViewportChange = useCallback(
    (v: { center: MapPoint; zoom: number }) => {
      const params = new URLSearchParams();
      params.set("lat", v.center.lat.toFixed(4));
      params.set("lng", v.center.lng.toFixed(4));
      params.set("z", v.zoom.toFixed(2));
      window.history.replaceState(null, "", `/map?${params.toString()}`);
    },
    [],
  );

  const onSelectMemorial = useCallback((m: MapFeatureMemorial, point: MapPoint) => {
    setSelected({ m, point });
    mapRef.current?.flyTo(point, Math.max(mapRef.current.getZoom(), 8));
  }, []);

  return (
    <div className="relative h-[calc(100dvh-4rem)] w-full overflow-hidden">
      <MemorialMap
        ref={mapRef}
        styleKey={style}
        initialCenter={{ lat: initial.lat, lng: initial.lng }}
        initialZoom={initial.zoom}
        onSelectMemorial={onSelectMemorial}
        onViewportChange={onViewportChange}
        onLoadingChange={setLoading}
        onStatsChange={setStats}
        activeMemorialId={selected?.m.id ?? null}
      />

      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:justify-between sm:p-4">
        <div className="pointer-events-auto flex-1 sm:max-w-md">
          <MapSearch
            onPlace={(p) => mapRef.current?.flyTo({ lat: p.lat, lng: p.lng }, 11)}
            onMemorial={(m) => {
              if (m.latitude != null && m.longitude != null) {
                mapRef.current?.flyTo({ lat: m.latitude, lng: m.longitude }, 14);
                setSelected({
                  m: {
                    kind: "memorial",
                    id: m.id,
                    slug: m.slug,
                    name: m.full_name,
                    birth_year: m.birth_year,
                    death_year: m.death_year,
                    epitaph: m.epitaph,
                    profile_image_path: m.profile_image_path,
                    family_group_id: null,
                    is_demo: false,
                    memorial_type: "deceased",
                  },
                  point: { lat: m.latitude, lng: m.longitude },
                });
              } else router.push(`/memorial/${m.slug}`);
            }}
          />
        </div>
        <div className="pointer-events-auto flex items-center gap-2 self-end sm:self-auto">
          <MapStyleSwitcher value={style} onChange={setStyle} />
          <Link href="/create" className="btn-primary hidden px-4 sm:inline-flex">
            <Plus size={16} /> Create
          </Link>
        </div>
      </div>

      {/* Status */}
      <div className="pointer-events-none absolute bottom-10 left-3 z-20 flex items-center gap-2 rounded-full bg-navy-900/80 px-3 py-1.5 text-xs text-ivory-400 backdrop-blur sm:bottom-4 sm:left-4">
        {loading ? <Spinner className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full bg-gold-400" aria-hidden />}
        {stats ? (
          <span>
            {compactNumber(stats.total)} {stats.total === 1 ? "memorial" : "memorials"} in view{stats.truncated ? " (zoom in to see all)" : ""}
          </span>
        ) : (
          <span>Explore the world</span>
        )}
      </div>

      <Sheet open={Boolean(selected)} onClose={() => setSelected(null)} title="">
        {selected && (
          <MemorialPreviewCard
            slug={selected.m.slug}
            name={selected.m.name}
            birthYear={selected.m.birth_year}
            deathYear={selected.m.death_year}
            epitaph={selected.m.epitaph}
            imagePath={selected.m.profile_image_path}
            memorialType={selected.m.memorial_type}
            isDemo={selected.m.is_demo}
          />
        )}
      </Sheet>
    </div>
  );
}
