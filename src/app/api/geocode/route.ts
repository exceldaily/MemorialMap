import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

/**
 * Reverse and forward geocoding proxy for Mapbox. Keeps the server token
 * private and normalises the response to a small shape.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const token = env.mapboxServerToken;
  if (!token) return NextResponse.json({ error: "Geocoding is not configured" }, { status: 503 });

  const q = sp.get("q");
  const lat = sp.get("lat");
  const lng = sp.get("lng");

  try {
    if (q) {
      const url = `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(q)}&limit=6&access_token=${token}`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      const json = await res.json();
      const results = (json.features ?? []).map((f: { properties: { full_address?: string; name?: string; place_formatted?: string }; geometry: { coordinates: [number, number] } }) => ({
        name: f.properties.name ?? f.properties.full_address ?? "",
        full: f.properties.full_address ?? [f.properties.name, f.properties.place_formatted].filter(Boolean).join(", "),
        lng: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
      }));
      return NextResponse.json({ results });
    }
    if (lat && lng) {
      const url = `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${encodeURIComponent(lng)}&latitude=${encodeURIComponent(lat)}&types=place,locality,region,country&access_token=${token}`;
      const res = await fetch(url, { next: { revalidate: 86400 } });
      const json = await res.json();
      const f = json.features?.[0];
      const name: string | null = f?.properties?.full_address ?? f?.properties?.place_formatted ?? f?.properties?.name ?? null;
      return NextResponse.json({ name });
    }
    return NextResponse.json({ error: "Provide q or lat/lng" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Geocoding failed" }, { status: 502 });
  }
}
