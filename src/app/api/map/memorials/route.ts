import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/map/memorials?bbox=minLng,minLat,maxLng,maxLat&zoom=Z
 * Returns only the published, public memorials inside the visible bounds.
 * At low zoom the database returns pre-aggregated clusters; at higher zoom
 * individual points (capped, with `truncated: true` when more exist).
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const bbox = (sp.get("bbox") ?? "").split(",").map(Number);
  const zoom = Number(sp.get("zoom") ?? 3);
  if (bbox.length !== 4 || bbox.some((n) => !Number.isFinite(n))) {
    return NextResponse.json({ error: "bbox must be minLng,minLat,maxLng,maxLat" }, { status: 400 });
  }
  let [minLng, minLat, maxLng, maxLat] = bbox;
  // Guard against wrapped/degenerate boxes
  if (maxLng - minLng >= 360) { minLng = -180; maxLng = 180; }
  minLat = Math.max(-85, minLat); maxLat = Math.min(85, maxLat);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("memorials_in_bounds", {
    p_min_lng: minLng,
    p_min_lat: minLat,
    p_max_lng: maxLng,
    p_max_lat: maxLat,
    p_zoom: Number.isFinite(zoom) ? zoom : 3,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60" },
  });
}
