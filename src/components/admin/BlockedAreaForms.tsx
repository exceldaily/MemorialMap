"use client";

import { useState } from "react";
import { adminBlockArea, adminBlockPolygon } from "@/lib/actions/admin";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { useAdminAction } from "./useAdminAction";

export function BlockedAreaForms() {
  const [mode, setMode] = useState<"point" | "polygon">("point");
  const { run, pending, feedback } = useAdminAction();
  const [point, setPoint] = useState({ name: "", reason: "", latitude: "", longitude: "", radius: "500" });
  const [poly, setPoly] = useState({ name: "", reason: "", geojson: "" });

  const submitPoint = (e: React.FormEvent) => {
    e.preventDefault();
    run(
      () =>
        adminBlockArea({
          name: point.name,
          reason: point.reason,
          latitude: Number(point.latitude),
          longitude: Number(point.longitude),
          radiusMeters: Number(point.radius),
        }),
      "Blocked area created.",
    );
  };
  const submitPolygon = (e: React.FormEvent) => {
    e.preventDefault();
    run(() => adminBlockPolygon({ name: poly.name, reason: poly.reason, geojson: poly.geojson }), "Blocked polygon created.");
  };

  return (
    <section className="card p-6" aria-labelledby="add-area">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="add-area" className="text-2xl text-ivory-50">
          Block a new area
        </h2>
        <div className="inline-flex rounded-full border border-white/10 bg-navy-950/60 p-1" role="group" aria-label="Area type">
          {(["point", "polygon"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${mode === m ? "bg-gold-400 text-navy-950" : "text-ivory-300 hover:text-ivory-50"}`}
            >
              {m === "point" ? "Point + radius" : "Polygon"}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-2 text-sm text-ivory-400">New memorial locations inside an active blocked area are refused. Existing memorials are not moved.</p>

      {mode === "point" ? (
        <form onSubmit={submitPoint} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="pa-name" className="label">Name</label>
            <input id="pa-name" className="input" required maxLength={120} value={point.name} onChange={(e) => setPoint({ ...point, name: e.target.value })} />
          </div>
          <div>
            <label htmlFor="pa-lat" className="label">Latitude</label>
            <input id="pa-lat" className="input" type="number" step="any" min={-90} max={90} required value={point.latitude} onChange={(e) => setPoint({ ...point, latitude: e.target.value })} />
          </div>
          <div>
            <label htmlFor="pa-lng" className="label">Longitude</label>
            <input id="pa-lng" className="input" type="number" step="any" min={-180} max={180} required value={point.longitude} onChange={(e) => setPoint({ ...point, longitude: e.target.value })} />
          </div>
          <div>
            <label htmlFor="pa-radius" className="label">Radius (metres)</label>
            <input id="pa-radius" className="input" type="number" min={10} max={2000000} required value={point.radius} onChange={(e) => setPoint({ ...point, radius: e.target.value })} />
          </div>
          <div>
            <label htmlFor="pa-reason" className="label">Reason (optional)</label>
            <input id="pa-reason" className="input" maxLength={500} value={point.reason} onChange={(e) => setPoint({ ...point, reason: e.target.value })} />
          </div>
          {feedback && <Alert kind={feedback.kind} className="sm:col-span-2">{feedback.text}</Alert>}
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? <Spinner className="h-4 w-4 border-navy-900/40 border-t-navy-900" /> : "Block this area"}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={submitPolygon} className="mt-5 grid gap-4">
          <div>
            <label htmlFor="pg-name" className="label">Name</label>
            <input id="pg-name" className="input" required maxLength={120} value={poly.name} onChange={(e) => setPoly({ ...poly, name: e.target.value })} />
          </div>
          <div>
            <label htmlFor="pg-reason" className="label">Reason (optional)</label>
            <input id="pg-reason" className="input" maxLength={500} value={poly.reason} onChange={(e) => setPoly({ ...poly, reason: e.target.value })} />
          </div>
          <div>
            <label htmlFor="pg-geojson" className="label">GeoJSON polygon</label>
            <textarea
              id="pg-geojson"
              className="input min-h-40 font-mono text-xs"
              required
              value={poly.geojson}
              onChange={(e) => setPoly({ ...poly, geojson: e.target.value })}
              placeholder='{"type":"Polygon","coordinates":[[[lng,lat],[lng,lat],[lng,lat],[lng,lat]]]}'
              spellCheck={false}
            />
            <p className="mt-1 text-xs text-ivory-500">Paste a Polygon or MultiPolygon geometry (or a Feature containing one). Coordinates are [longitude, latitude].</p>
          </div>
          {feedback && <Alert kind={feedback.kind}>{feedback.text}</Alert>}
          <div>
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? <Spinner className="h-4 w-4 border-navy-900/40 border-t-navy-900" /> : "Block this polygon"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
