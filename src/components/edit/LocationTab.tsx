"use client";

import dynamic from "next/dynamic";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Move, Sparkles } from "lucide-react";
import { LocationPicker, type ChosenLocation } from "@/components/map/LocationPicker";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { claimLocation, publishMemorial } from "@/lib/actions/memorial";
import { formatCoord } from "@/lib/format";
import { LOCATION_DISCLAIMER_SHORT } from "@/lib/site";
import type { Memorial, MemorialLocation } from "@/lib/supabase/types";
import { Section } from "./shared";

const MemorialMap = dynamic(() => import("@/components/map/MemorialMap").then((m) => m.MemorialMap), { ssr: false });

export function LocationTab({ memorial, location: initial }: { memorial: Memorial; location: MemorialLocation | null }) {
  const router = useRouter();
  const [location, setLocation] = useState(initial);
  const [moving, setMoving] = useState(!initial);
  const [chosen, setChosen] = useState<ChosenLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [publishing, startPublish] = useTransition();

  function save() {
    if (!chosen) return;
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const res = await claimLocation(memorial.id, chosen.lat, chosen.lng, chosen.placeName);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (!res.data?.available) {
        setError(res.data?.message ?? "That location is no longer available. Please choose another.");
        setChosen(null);
        return;
      }
      const loc = res.data.location;
      setLocation((prev) => ({
        id: loc?.id ?? prev?.id ?? "",
        memorial_id: memorial.id,
        latitude: loc?.latitude ?? chosen.lat,
        longitude: loc?.longitude ?? chosen.lng,
        place_name: loc?.place_name ?? chosen.placeName,
        spacing_meters: prev?.spacing_meters ?? null,
        created_at: prev?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      setChosen(null);
      setMoving(false);
      setNotice(initial ? "Memorial location moved." : "Memorial location reserved.");
      router.refresh();
    });
  }

  function publish() {
    setError(null);
    startPublish(async () => {
      const res = await publishMemorial(memorial.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push(`/memorial/${memorial.slug}`);
    });
  }

  return (
    <div className="space-y-6">
      <Section
        title="Memorial location"
        description="The virtual place on the world map where this memorial lives."
        actions={
          location && !moving ? (
            <button type="button" className="btn-secondary" onClick={() => setMoving(true)}>
              <Move size={15} /> Move memorial location
            </button>
          ) : undefined
        }
      >
        {notice && (
          <Alert kind="success" className="mb-4">
            {notice}
          </Alert>
        )}
        {error && (
          <Alert kind="error" className="mb-4">
            {error}
          </Alert>
        )}

        {location && !moving && (
          <div>
            <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-navy-950/40 p-4">
              <MapPin size={18} className="mt-0.5 shrink-0 text-gold-400" aria-hidden />
              <div className="text-sm">
                <p className="text-ivory-100">{location.place_name ?? "Approximate place name unavailable"}</p>
                <p className="mt-0.5 text-xs text-ivory-500">
                  {formatCoord(location.latitude, "lat")} · {formatCoord(location.longitude, "lng")}
                </p>
              </div>
            </div>
            <div className="mt-4 h-64 overflow-hidden rounded-2xl border border-white/10 sm:h-80">
              <MemorialMap mode="explore" interactive={false} showMemorials={false} showControls={false} selectedPoint={{ lat: location.latitude, lng: location.longitude }} initialCenter={{ lat: location.latitude, lng: location.longitude }} initialZoom={13} className="h-full w-full" />
            </div>
          </div>
        )}

        {!location && !moving && <EmptyState title="No memorial location yet" body="Choose a place on the map to reserve this memorial's spot." action={<button type="button" className="btn-primary" onClick={() => setMoving(true)}>Choose a location</button>} />}

        {moving && (
          <div className="space-y-4">
            <Alert kind="info">{LOCATION_DISCLAIMER_SHORT}</Alert>
            <LocationPicker value={chosen} onChange={setChosen} excludeMemorialId={memorial.id} familyGroupId={memorial.family_group_id} initialCenter={location ? { lat: location.latitude, lng: location.longitude } : undefined} initialZoom={location ? 13 : undefined} className="h-[60vh] min-h-[420px]" />
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              {location && (
                <button type="button" className="btn-ghost" onClick={() => { setMoving(false); setChosen(null); }} disabled={pending}>
                  Cancel
                </button>
              )}
              <button type="button" className="btn-primary" onClick={save} disabled={!chosen || pending}>
                {pending ? <Spinner className="h-4 w-4 border-navy-900/40 border-t-navy-900" /> : location ? "Save new location" : "Reserve this location"}
              </button>
            </div>
          </div>
        )}

        <p className="mt-4 text-[11px] leading-relaxed text-ivory-500">{LOCATION_DISCLAIMER_SHORT}</p>
      </Section>

      {memorial.status === "draft" && (
        <Section title="Publish" description={location ? "This memorial is ready to be published." : "A memorial location is required before publishing."}>
          <button type="button" className="btn-primary" onClick={publish} disabled={!location || publishing}>
            {publishing ? <Spinner className="h-4 w-4 border-navy-900/40 border-t-navy-900" /> : <Sparkles size={16} />} Publish Memorial
          </button>
        </Section>
      )}
    </div>
  );
}
