"use client";

import mapboxgl, { type GeoJSONSource, type LngLatLike, type MapMouseEvent } from "mapbox-gl";
import type { Point as GeoPoint } from "geojson";
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from "react";
import type { MapFeatureCollection, MapFeatureMemorial } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { MapMissingToken } from "./MapMissingToken";

export type MapStyleKey = "dark" | "satellite" | "terrain";

export const MAP_STYLES: Record<MapStyleKey, { label: string; url: string }> = {
  dark: { label: "Night", url: "mapbox://styles/mapbox/dark-v11" },
  satellite: { label: "Satellite", url: "mapbox://styles/mapbox/satellite-streets-v12" },
  terrain: { label: "Terrain", url: "mapbox://styles/mapbox/outdoors-v12" },
};

export type MapPoint = { lat: number; lng: number };

export interface MemorialMapHandle {
  flyTo: (p: MapPoint, zoom?: number) => void;
  getCenter: () => MapPoint | null;
  getZoom: () => number;
  resize: () => void;
}

export interface MemorialMapProps {
  className?: string;
  /** `explore` shows markers and preview; `choose` lets the user pick a point. */
  mode?: "explore" | "choose";
  styleKey?: MapStyleKey;
  initialCenter?: MapPoint;
  initialZoom?: number;
  interactive?: boolean;
  /** Hide the memorial layers entirely (e.g. static mini-maps). */
  showMemorials?: boolean;
  /** A point to render as a temporary/selected marker (choose mode or memorial page). */
  selectedPoint?: MapPoint | null;
  /** Family group id to emphasise on the map. */
  highlightFamilyGroupId?: string | null;
  /** Points to render as suggestion markers (nearby available locations). */
  suggestions?: MapPoint[];
  onSelectMemorial?: (m: MapFeatureMemorial, point: MapPoint) => void;
  onPickPoint?: (p: MapPoint) => void;
  onSuggestionPick?: (p: MapPoint) => void;
  onViewportChange?: (v: { center: MapPoint; zoom: number }) => void;
  onLoadingChange?: (loading: boolean) => void;
  onStatsChange?: (s: { total: number; truncated: boolean }) => void;
  showControls?: boolean;
  cooperativeGestures?: boolean;
  activeMemorialId?: string | null;
}

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const SRC_POINTS = "memorial-points";
const SRC_CLUSTERS = "memorial-server-clusters";
const FONT = ["DIN Pro Medium", "Arial Unicode MS Regular"];

export const MemorialMap = forwardRef<MemorialMapHandle, MemorialMapProps>(function MemorialMap(
  {
    className,
    mode = "explore",
    styleKey = "dark",
    initialCenter = { lat: 24, lng: 8 },
    initialZoom = 1.6,
    interactive = true,
    showMemorials = true,
    selectedPoint = null,
    highlightFamilyGroupId = null,
    suggestions = [],
    onSelectMemorial,
    onPickPoint,
    onSuggestionPick,
    onViewportChange,
    onLoadingChange,
    onStatsChange,
    showControls = true,
    cooperativeGestures = false,
    activeMemorialId = null,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [ready, setReady] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const tempMarker = useRef<mapboxgl.Marker | null>(null);
  const suggestionMarkers = useRef<mapboxgl.Marker[]>([]);
  const styleUrl = MAP_STYLES[styleKey].url;

  // Keep the latest callbacks in refs so map listeners never go stale.
  const cb = useRef({ onSelectMemorial, onPickPoint, onViewportChange, onLoadingChange, onStatsChange, mode, showMemorials, highlightFamilyGroupId, activeMemorialId });
  cb.current = { onSelectMemorial, onPickPoint, onViewportChange, onLoadingChange, onStatsChange, mode, showMemorials, highlightFamilyGroupId, activeMemorialId };

  useImperativeHandle(ref, () => ({
    flyTo: (p, zoom) => mapRef.current?.flyTo({ center: [p.lng, p.lat], zoom: zoom ?? Math.max(mapRef.current.getZoom(), 12), essential: true, duration: 1400 }),
    getCenter: () => {
      const c = mapRef.current?.getCenter();
      return c ? { lat: c.lat, lng: c.lng } : null;
    },
    getZoom: () => mapRef.current?.getZoom() ?? initialZoom,
    resize: () => mapRef.current?.resize(),
  }));

  /* ---- Data loading ---------------------------------------------------- */
  const loadViewport = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !cb.current.showMemorials) return;
    const b = map.getBounds();
    if (!b) return;
    const zoom = map.getZoom();
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    cb.current.onLoadingChange?.(true);
    try {
      const pad = 0.15; // pre-load a little beyond the edges for smooth panning
      const w = b.getEast() - b.getWest();
      const h = b.getNorth() - b.getSouth();
      const bbox = [b.getWest() - w * pad, b.getSouth() - h * pad, b.getEast() + w * pad, b.getNorth() + h * pad].map((n) => n.toFixed(5)).join(",");
      const res = await fetch(`/api/map/memorials?bbox=${bbox}&zoom=${zoom.toFixed(2)}`, { signal: ac.signal });
      if (!res.ok) throw new Error("map load failed");
      const fc = (await res.json()) as MapFeatureCollection;
      if (ac.signal.aborted || !mapRef.current) return;
      const pts = map.getSource(SRC_POINTS) as GeoJSONSource | undefined;
      const cls = map.getSource(SRC_CLUSTERS) as GeoJSONSource | undefined;
      if (fc.mode === "clusters") {
        cls?.setData({ type: "FeatureCollection", features: fc.features });
        pts?.setData({ type: "FeatureCollection", features: [] });
      } else {
        pts?.setData({ type: "FeatureCollection", features: fc.features });
        cls?.setData({ type: "FeatureCollection", features: [] });
      }
      cb.current.onStatsChange?.({ total: fc.total, truncated: Boolean(fc.truncated) });
    } catch (e) {
      if ((e as Error).name !== "AbortError") console.error(e);
    } finally {
      if (!ac.signal.aborted) cb.current.onLoadingChange?.(false);
    }
  }, []);

  /* ---- Layers ----------------------------------------------------------- */
  const addLayers = useCallback((map: mapboxgl.Map) => {
    if (map.getSource(SRC_POINTS)) return;
    map.addSource(SRC_POINTS, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      cluster: true,
      clusterRadius: 44,
      clusterMaxZoom: 16,
      promoteId: "id",
    });
    map.addSource(SRC_CLUSTERS, { type: "geojson", data: { type: "FeatureCollection", features: [] } });

    const gold = "#d3b877";
    const goldDeep = "#a4864a";
    const sage = "#8aa88a";
    const navy = "#0b1220";
    const familyExpr: mapboxgl.ExpressionSpecification = [
      "case",
      ["all", ["has", "family_group_id"], ["!=", ["get", "family_group_id"], null]],
      sage,
      gold,
    ];

    // Server-side clusters (low zoom)
    map.addLayer({
      id: "sc-glow",
      type: "circle",
      source: SRC_CLUSTERS,
      paint: {
        "circle-color": gold,
        "circle-opacity": 0.18,
        "circle-radius": ["interpolate", ["linear"], ["get", "count"], 1, 18, 50, 28, 500, 40, 5000, 52],
        "circle-blur": 0.6,
      },
    });
    map.addLayer({
      id: "sc-core",
      type: "circle",
      source: SRC_CLUSTERS,
      paint: {
        "circle-color": gold,
        "circle-radius": ["interpolate", ["linear"], ["get", "count"], 1, 12, 50, 18, 500, 26, 5000, 34],
        "circle-stroke-color": goldDeep,
        "circle-stroke-width": 1.5,
      },
    });
    map.addLayer({
      id: "sc-count",
      type: "symbol",
      source: SRC_CLUSTERS,
      layout: {
        "text-field": ["step", ["zoom"], ["to-string", ["get", "count"]], 3, ["concat", ["to-string", ["get", "count"]], "\nmemorials"]],
        "text-font": FONT,
        "text-size": ["interpolate", ["linear"], ["zoom"], 0, 10, 4, 12],
        "text-allow-overlap": true,
        "text-line-height": 1.1,
      },
      paint: { "text-color": navy },
    });

    // Client-side clusters (mid zoom)
    map.addLayer({
      id: "pc-glow",
      type: "circle",
      source: SRC_POINTS,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": gold,
        "circle-opacity": 0.18,
        "circle-radius": ["step", ["get", "point_count"], 22, 10, 28, 50, 36, 200, 44],
        "circle-blur": 0.6,
      },
    });
    map.addLayer({
      id: "pc-core",
      type: "circle",
      source: SRC_POINTS,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": gold,
        "circle-radius": ["step", ["get", "point_count"], 14, 10, 18, 50, 24, 200, 30],
        "circle-stroke-color": goldDeep,
        "circle-stroke-width": 1.5,
      },
    });
    map.addLayer({
      id: "pc-count",
      type: "symbol",
      source: SRC_POINTS,
      filter: ["has", "point_count"],
      layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": FONT, "text-size": 12, "text-allow-overlap": true },
      paint: { "text-color": navy },
    });

    // Individual memorials: soft halo + glowing core, family groups in sage.
    map.addLayer({
      id: "pt-halo",
      type: "circle",
      source: SRC_POINTS,
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": familyExpr,
        "circle-opacity": ["case", ["boolean", ["feature-state", "active"], false], 0.45, 0.22],
        "circle-radius": ["case", ["boolean", ["feature-state", "active"], false], 22, 14],
        "circle-blur": 0.7,
      },
    });
    map.addLayer({
      id: "pt-core",
      type: "circle",
      source: SRC_POINTS,
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": familyExpr,
        "circle-radius": ["case", ["boolean", ["feature-state", "active"], false], 8, 6],
        "circle-stroke-color": navy,
        "circle-stroke-width": 2,
      },
    });
    map.addLayer({
      id: "pt-label",
      type: "symbol",
      source: SRC_POINTS,
      filter: ["!", ["has", "point_count"]],
      minzoom: 11,
      layout: {
        "text-field": ["get", "name"],
        "text-font": FONT,
        "text-size": 12,
        "text-offset": [0, 1.3],
        "text-anchor": "top",
        "text-optional": true,
      },
      paint: { "text-color": "#f4efe4", "text-halo-color": navy, "text-halo-width": 1.2 },
    });
  }, []);

  /* ---- Map init --------------------------------------------------------- */
  useEffect(() => {
    if (!TOKEN || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: [initialCenter.lng, initialCenter.lat],
      zoom: initialZoom,
      projection: "globe",
      attributionControl: false,
      interactive,
      cooperativeGestures,
      minZoom: 1,
      maxZoom: 20,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
    if (showControls && interactive) {
      map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), "bottom-right");
      map.addControl(
        new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false, showUserHeading: false, fitBoundsOptions: { maxZoom: 13 } }),
        "bottom-right",
      );
    }

    map.on("style.load", () => {
      map.setFog({ color: "#0b1220", "high-color": "#1a2538", "horizon-blend": 0.06, "space-color": "#070b14", "star-intensity": 0.35 });
      if (cb.current.showMemorials) {
        addLayers(map);
        void loadViewport();
      }
    });
    map.on("load", () => setReady(true));

    let t: ReturnType<typeof setTimeout> | undefined;
    map.on("moveend", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        void loadViewport();
        const c = map.getCenter();
        cb.current.onViewportChange?.({ center: { lat: c.lat, lng: c.lng }, zoom: map.getZoom() });
      }, 180);
    });

    const hoverLayers = ["pt-core", "pc-core", "sc-core"];
    hoverLayers.forEach((l) => {
      map.on("mouseenter", l, () => {
        if (cb.current.mode !== "choose") map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", l, () => {
        map.getCanvas().style.cursor = cb.current.mode === "choose" ? "crosshair" : "";
      });
    });

    map.on("click", (e: MapMouseEvent) => {
      const layers = ["pt-core", "pt-halo", "pc-core", "sc-core"].filter((l) => map.getLayer(l));
      const feats = layers.length ? map.queryRenderedFeatures(e.point, { layers }) : [];
      const f = feats[0] as (mapboxgl.GeoJSONFeature & { geometry: GeoPoint; properties: Record<string, unknown>; layer?: { id: string } }) | undefined;
      if (f?.layer?.id === "sc-core" || f?.layer?.id === "pc-core") {
        // Zoom into a cluster
        const [lng, lat] = f.geometry.coordinates;
        if (f.layer.id === "pc-core") {
          const src = map.getSource(SRC_POINTS) as GeoJSONSource;
          src.getClusterExpansionZoom(f.properties.cluster_id as number, (err, zoom) => {
            map.easeTo({ center: [lng, lat], zoom: err || zoom == null ? map.getZoom() + 2 : Math.min(zoom + 0.3, 18), duration: 800 });
          });
        } else {
          map.easeTo({ center: [lng, lat], zoom: Math.min(map.getZoom() + 2.2, 18), duration: 800 });
        }
        return;
      }
      if (f && (f.layer?.id === "pt-core" || f.layer?.id === "pt-halo")) {
        const props = f.properties as unknown as MapFeatureMemorial;
        const [lng, lat] = f.geometry.coordinates;
        if (cb.current.mode === "choose") {
          // Occupied location: still report, the parent explains it's reserved.
          cb.current.onPickPoint?.({ lat, lng });
          return;
        }
        cb.current.onSelectMemorial?.({ ...props, is_demo: String(props.is_demo) === "true" }, { lat, lng });
        return;
      }
      if (cb.current.mode === "choose") {
        cb.current.onPickPoint?.({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      }
    });

    return () => {
      abortRef.current?.abort();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Style switching -------------------------------------------------- */
  const firstStyle = useRef(styleUrl);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (firstStyle.current === styleUrl) return;
    firstStyle.current = styleUrl;
    map.setStyle(styleUrl);
  }, [styleUrl, ready]);

  /* ---- Choose-mode cursor -------------------------------------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor = mode === "choose" ? "crosshair" : "";
  }, [mode, ready]);

  /* ---- Active feature highlight ------------------------------------- */
  const prevActive = useRef<string | null>(null);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !map.getSource(SRC_POINTS)) return;
    if (prevActive.current) map.setFeatureState({ source: SRC_POINTS, id: prevActive.current }, { active: false });
    if (activeMemorialId) map.setFeatureState({ source: SRC_POINTS, id: activeMemorialId }, { active: true });
    prevActive.current = activeMemorialId;
  }, [activeMemorialId, ready]);

  /* ---- Temporary / selected marker ----------------------------------- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (!selectedPoint) {
      tempMarker.current?.remove();
      tempMarker.current = null;
      return;
    }
    const ll: LngLatLike = [selectedPoint.lng, selectedPoint.lat];
    if (!tempMarker.current) {
      const el = document.createElement("div");
      el.className = "memorial-marker is-temp";
      el.setAttribute("aria-label", "Selected memorial location");
      const m = new mapboxgl.Marker({ element: el, draggable: mode === "choose", anchor: "center" }).setLngLat(ll).addTo(map);
      m.on("dragend", () => {
        const p = m.getLngLat();
        cb.current.onPickPoint?.({ lat: p.lat, lng: p.lng });
      });
      tempMarker.current = m;
    } else {
      tempMarker.current.setLngLat(ll);
      tempMarker.current.setDraggable(mode === "choose");
    }
  }, [selectedPoint, mode, ready]);

  /* ---- Suggestion markers ------------------------------------------- */
  const suggestionKey = useMemo(() => suggestions.map((s) => `${s.lat.toFixed(6)},${s.lng.toFixed(6)}`).join("|"), [suggestions]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    suggestionMarkers.current.forEach((m) => m.remove());
    suggestionMarkers.current = suggestions.map((s) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "memorial-marker is-family";
      el.style.width = "16px";
      el.style.height = "16px";
      el.setAttribute("aria-label", "Nearby available location");
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        onSuggestionPick?.(s);
      });
      return new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([s.lng, s.lat]).addTo(map);
    });
    return () => {
      suggestionMarkers.current.forEach((m) => m.remove());
      suggestionMarkers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestionKey, ready]);

  if (!TOKEN) return <MapMissingToken className={className} />;

  return (
    <div className={cn("relative h-full w-full bg-navy-950", mode === "choose" && "map-choose-mode", className)}>
      <div ref={containerRef} className="absolute inset-0" role="application" aria-label="Interactive memorial map" />
      {!ready && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-navy-950/60 text-sm text-ivory-400 animate-fade-in">
          Loading the map…
        </div>
      )}
    </div>
  );
});
