import { Suspense } from "react";
import type { Metadata } from "next";
import { ExploreMap } from "@/components/map/ExploreMap";

export const metadata: Metadata = {
  title: "Memorial Map",
  description: "Explore memorials from around the world. Zoom anywhere, visit a story, or choose a place to remember someone.",
};

export default function MapPage() {
  return (
    <main>
      <h1 className="sr-only">Memorial Map</h1>
      <Suspense fallback={<div className="h-[calc(100dvh-4rem)] bg-navy-950" />}>
        <ExploreMap />
      </Suspense>
    </main>
  );
}
