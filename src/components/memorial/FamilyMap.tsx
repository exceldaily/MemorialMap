"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { MapPoint } from "@/components/map/MemorialMap";

const MemorialMap = dynamic(() => import("@/components/map/MemorialMap").then((m) => m.MemorialMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-navy-950/60" aria-hidden />,
});

/** Explore-mode map for a family memorial area. Family members render in sage. */
export function FamilyMap({ familyGroupId, center, zoom = 15 }: { familyGroupId: string; center: MapPoint; zoom?: number }) {
  const router = useRouter();
  return (
    <MemorialMap
      className="h-full w-full"
      mode="explore"
      initialCenter={center}
      initialZoom={zoom}
      highlightFamilyGroupId={familyGroupId}
      showControls
      cooperativeGestures
      onSelectMemorial={(m) => router.push(`/memorial/${m.slug}`)}
    />
  );
}
