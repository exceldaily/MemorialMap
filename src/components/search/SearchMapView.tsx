"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import type { MapFeatureMemorial, SearchResult } from "@/lib/supabase/types";
import type { MemorialMapHandle, MapPoint } from "@/components/map/MemorialMap";
import { SearchResultCard } from "./SearchResultCard";
import { EmptyState } from "@/components/ui/EmptyState";

const MemorialMap = dynamic(() => import("@/components/map/MemorialMap").then((m) => m.MemorialMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-navy-950" aria-hidden />,
});

type Located = SearchResult & { latitude: number; longitude: number };

/** Center and zoom that comfortably frames the given results. */
function frame(points: Located[]): { center: MapPoint; zoom: number } {
  if (points.length === 0) return { center: { lat: 24, lng: 8 }, zoom: 1.6 };
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const center = { lat: lats.reduce((a, b) => a + b, 0) / lats.length, lng: lngs.reduce((a, b) => a + b, 0) / lngs.length };
  const spread = Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs));
  const zoom = points.length === 1 ? 11 : spread > 60 ? 2 : spread > 15 ? 4 : spread > 2 ? 8 : 11;
  return { center, zoom };
}

export function SearchMapView({ results }: { results: SearchResult[] }) {
  const router = useRouter();
  const mapRef = useRef<MemorialMapHandle>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const located = useMemo(() => results.filter((r): r is Located => r.latitude != null && r.longitude != null), [results]);
  const unlocated = results.length - located.length;
  const initial = useMemo(() => frame(located), [located]);

  const focus = (r: Located) => {
    setActiveId(r.id);
    mapRef.current?.flyTo({ lat: r.latitude, lng: r.longitude }, 13);
  };

  if (located.length === 0) {
    return <EmptyState title="No memorial locations to show" body="None of these results have a memorial location on the map yet. Switch to the list view to see them." />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <div className="relative h-[55vh] min-h-[360px] overflow-hidden rounded-2xl border border-white/8 shadow-soft lg:h-[70vh]">
        <MemorialMap
          ref={mapRef}
          mode="explore"
          initialCenter={initial.center}
          initialZoom={initial.zoom}
          cooperativeGestures
          activeMemorialId={activeId}
          onSelectMemorial={(m: MapFeatureMemorial) => router.push(`/memorial/${m.slug}`)}
          className="h-full w-full"
        />
      </div>
      <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1" role="list" aria-label="Results on the map">
        {unlocated > 0 && (
          <p className="text-xs text-ivory-500">
            {unlocated} {unlocated === 1 ? "result has" : "results have"} no memorial location yet and {unlocated === 1 ? "is" : "are"} only shown in the list view.
          </p>
        )}
        {located.map((r) => (
          <div key={r.id} role="listitem">
            <SearchResultCard r={r} compact active={activeId === r.id} onFocus={() => focus(r)} />
          </div>
        ))}
      </div>
    </div>
  );
}
