"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { MapFeatureMemorial } from "@/lib/supabase/types";
import type { MapPoint } from "@/components/map/MemorialMap";
import { compactNumber } from "@/lib/format";

const MemorialMap = dynamic(() => import("@/components/map/MemorialMap").then((m) => m.MemorialMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-navy-950" aria-hidden />,
});

/**
 * Interactive preview of the world map on the homepage. Selecting a marker
 * hands the visitor over to the full map, focused on that memorial.
 */
export function HomeMapPreview() {
  const router = useRouter();
  const [stats, setStats] = useState<{ total: number } | null>(null);

  const onSelectMemorial = useCallback(
    (m: MapFeatureMemorial, p: MapPoint) => {
      const params = new URLSearchParams({ lat: p.lat.toFixed(4), lng: p.lng.toFixed(4), z: "14", focus: m.slug });
      router.push(`/map?${params.toString()}`);
    },
    [router],
  );

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gold-400/10 blur-3xl" aria-hidden />
      <div className="relative h-[60vh] min-h-[360px] w-full overflow-hidden rounded-3xl border border-gold-400/20 shadow-glow">
        <MemorialMap
          mode="explore"
          initialZoom={1.4}
          cooperativeGestures
          showControls={false}
          onSelectMemorial={onSelectMemorial}
          onStatsChange={(s) => setStats({ total: s.total })}
          className="h-full w-full"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-navy-950/80 to-transparent p-4 sm:p-5">
          <p className="text-xs text-ivory-300">
            {stats && stats.total > 0 ? `${compactNumber(stats.total)} ${stats.total === 1 ? "memorial" : "memorials"} in view` : "A world of stories, waiting to be visited."}
          </p>
          <Link href="/map" className="btn-secondary pointer-events-auto px-4 py-2 text-xs">
            Open the full map <ArrowUpRight size={14} aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
