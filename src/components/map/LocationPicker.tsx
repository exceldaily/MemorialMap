"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { Crosshair, MapPin, Move } from "lucide-react";
import type { MapStyleKey, MemorialMapHandle, MapPoint } from "./MemorialMap";
import { MapSearch } from "./MapSearch";
import { MapStyleSwitcher } from "./MapStyleSwitcher";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { CheckLocationResult } from "@/lib/supabase/types";
import { formatCoord } from "@/lib/format";
import { LOCATION_DISCLAIMER_SHORT } from "@/lib/site";
import { cn } from "@/lib/utils";

const MemorialMap = dynamic(() => import("./MemorialMap").then((m) => m.MemorialMap), { ssr: false });

export type ChosenLocation = MapPoint & { placeName: string | null };

/**
 * "Choose Memorial Location" mode. Click or tap anywhere, drop a temporary
 * marker, see the coordinates and approximate place name, check availability
 * against the spacing rules and confirm.
 */
export function LocationPicker({
  value,
  onChange,
  familyGroupId,
  excludeMemorialId,
  className,
  initialCenter,
  initialZoom,
}: {
  value: ChosenLocation | null;
  onChange: (loc: ChosenLocation | null) => void;
  familyGroupId?: string | null;
  excludeMemorialId?: string | null;
  className?: string;
  initialCenter?: MapPoint;
  initialZoom?: number;
}) {
  const mapRef = useRef<MemorialMapHandle>(null);
  const [style, setStyle] = useState<MapStyleKey>("dark");
  const [pending, setPending] = useState<MapPoint | null>(value ? { lat: value.lat, lng: value.lng } : null);
  const [placeName, setPlaceName] = useState<string | null>(value?.placeName ?? null);
  const [check, setCheck] = useState<CheckLocationResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [confirmed, setConfirmed] = useState(Boolean(value));

  const runCheck = useCallback(
    async (p: MapPoint) => {
      setChecking(true);
      setCheck(null);
      setPlaceName(null);
      const supabase = createSupabaseBrowserClient();
      const [{ data, error }, geo] = await Promise.all([
        supabase.rpc("check_location", {
          p_latitude: p.lat,
          p_longitude: p.lng,
          p_family_group_id: familyGroupId ?? null,
          p_exclude_memorial_id: excludeMemorialId ?? null,
        }),
        fetch(`/api/geocode?lat=${p.lat}&lng=${p.lng}`).then((r) => (r.ok ? r.json() : { name: null })).catch(() => ({ name: null })),
      ]);
      setPlaceName(geo?.name ?? null);
      setCheck(error ? { available: false, reason: "invalid_coordinates", message: error.message } : (data as CheckLocationResult));
      setChecking(false);
    },
    [familyGroupId, excludeMemorialId],
  );

  const pick = useCallback(
    (p: MapPoint) => {
      setPending(p);
      setConfirmed(false);
      onChange(null);
      void runCheck(p);
    },
    [onChange, runCheck],
  );

  useEffect(() => {
    if (value && !pending) setPending({ lat: value.lat, lng: value.lng });
  }, [value, pending]);

  const suggestions = (check?.suggestions ?? []).map((s) => ({ lat: s.latitude, lng: s.longitude }));

  return (
    <div className={cn("relative h-[70vh] min-h-[460px] w-full overflow-hidden rounded-2xl border border-white/10", className)}>
      <MemorialMap
        ref={mapRef}
        mode="choose"
        styleKey={style}
        initialCenter={pending ?? initialCenter ?? { lat: 30, lng: 0 }}
        initialZoom={pending ? 15 : (initialZoom ?? 1.8)}
        selectedPoint={pending}
        suggestions={suggestions}
        onPickPoint={pick}
        onSuggestionPick={(p) => {
          pick(p);
          mapRef.current?.flyTo(p, 18);
        }}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="pointer-events-auto flex-1 sm:max-w-sm">
          <MapSearch placeholder="Search for a meaningful place" onPlace={(p) => mapRef.current?.flyTo({ lat: p.lat, lng: p.lng }, 14)} />
        </div>
        <div className="pointer-events-auto self-end sm:self-auto">
          <MapStyleSwitcher value={style} onChange={setStyle} />
        </div>
      </div>

      {!pending && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-4">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-navy-900/90 px-4 py-2 text-sm text-ivory-200 shadow-soft backdrop-blur">
            <Crosshair size={16} className="text-gold-400" /> Tap anywhere on the map to choose a memorial location
          </div>
        </div>
      )}

      {pending && (
        <div className="absolute inset-x-0 bottom-0 z-20 max-h-[60%] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-navy-900/95 p-4 backdrop-blur-md sm:inset-x-auto sm:bottom-4 sm:left-4 sm:w-[380px] sm:rounded-2xl sm:border animate-fade-up">
          <p className="eyebrow">Selected Memorial Location</p>
          <div className="mt-2 flex items-start gap-3">
            <MapPin size={18} className="mt-0.5 shrink-0 text-gold-400" aria-hidden />
            <div className="min-w-0 text-sm">
              <p className="text-ivory-100">{placeName ?? (checking ? "Finding place name…" : "Approximate place name unavailable")}</p>
              <p className="mt-1 text-xs text-ivory-500">
                Latitude {formatCoord(pending.lat, "lat")} · Longitude {formatCoord(pending.lng, "lng")}
              </p>
            </div>
          </div>

          <div className="mt-3 min-h-[2.5rem]">
            {checking && (
              <div className="flex items-center gap-2 text-xs text-ivory-400">
                <Spinner className="h-3.5 w-3.5" /> Checking availability…
              </div>
            )}
            {!checking && check && !check.available && (
              <Alert kind="warning">
                {check.message}
                {check.reason === "reserved" && suggestions.length > 0 && <span className="mt-1 block text-xs">Green markers nearby are available — tap one to move there.</span>}
              </Alert>
            )}
            {!checking && check?.available && !confirmed && <Alert kind="success">{check.message}</Alert>}
            {confirmed && <Alert kind="success">Memorial location chosen. You can still move the marker to change it.</Alert>}
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-ivory-500">{LOCATION_DISCLAIMER_SHORT}</p>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="btn-primary flex-1"
              disabled={checking || !check?.available || confirmed}
              onClick={() => {
                setConfirmed(true);
                onChange({ ...pending, placeName });
              }}
            >
              {confirmed ? "Location chosen" : "Choose This Location"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setPending(null);
                setCheck(null);
                setConfirmed(false);
                onChange(null);
              }}
            >
              <Move size={15} /> Move Marker
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
