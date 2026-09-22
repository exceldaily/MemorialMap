import Link from "next/link";
import { MapPin } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Alert } from "@/components/ui/Alert";
import { AdminHeader, AdminTable, Td, Badge } from "@/components/admin/AdminShell";
import { AreaActiveToggle } from "@/components/admin/ActionButtons";
import { BlockedAreaForms } from "@/components/admin/BlockedAreaForms";
import { formatCoord, timeAgo } from "@/lib/format";

export const metadata = { title: "Blocked areas" };

/**
 * PostGIS geography columns come back from PostgREST as hex-encoded EWKB.
 * For a point that is: byte order (1) + type (4, with SRID flag) + SRID (4) + x (8) + y (8).
 */
function parsePointWkb(value: unknown): { lat: number; lng: number } | null {
  if (typeof value !== "string" || !/^[0-9a-fA-F]+$/.test(value) || value.length < 42) return null;
  try {
    const bytes = new Uint8Array(value.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
    const view = new DataView(bytes.buffer);
    const little = bytes[0] === 1;
    const type = view.getUint32(1, little);
    if ((type & 0xff) !== 1) return null; // not a point
    const hasSrid = (type & 0x20000000) !== 0;
    const off = 5 + (hasSrid ? 4 : 0);
    const lng = view.getFloat64(off, little);
    const lat = view.getFloat64(off + 8, little);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  } catch {
    return null;
  }
}

export default async function AdminBlockedAreasPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("blocked_geographic_areas")
    .select("id, name, reason, area_type, center, radius_meters, is_active, created_at")
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = data ?? [];

  return (
    <>
      <AdminHeader title="Blocked geographic areas" body="Areas where new memorial locations are not accepted, for legal, safety or moderation reasons. Deactivate an area rather than deleting it so the history is kept." />
      <div className="mb-8">
        <BlockedAreaForms />
      </div>
      {error && <Alert kind="error" className="mb-4">Could not load blocked areas. {error.message}</Alert>}
      {rows.length === 0 ? (
        <p className="text-sm text-ivory-500">No blocked areas have been defined.</p>
      ) : (
        <AdminTable head={["Area", "Type", "Extent", "Status", "Created", "Actions"]}>
          {rows.map((a) => {
            const center = a.area_type === "point_radius" ? parsePointWkb(a.center) : null;
            return (
              <tr key={a.id}>
                <Td>
                  <p className="text-ivory-50">{a.name}</p>
                  {a.reason && <p className="text-xs text-ivory-500">{a.reason}</p>}
                </Td>
                <Td className="text-xs text-ivory-400">{a.area_type === "point_radius" ? "Point + radius" : "Polygon"}</Td>
                <Td className="text-xs text-ivory-400">
                  {a.area_type === "point_radius" ? (
                    <>
                      {center ? (
                        <Link href={`/map?lat=${center.lat}&lng=${center.lng}&z=12`} className="inline-flex items-center gap-1 font-mono hover:text-gold-200">
                          <MapPin size={12} aria-hidden /> {formatCoord(center.lat, "lat")}, {formatCoord(center.lng, "lng")}
                        </Link>
                      ) : (
                        "Center stored"
                      )}
                      <br />
                      Radius {a.radius_meters != null ? `${a.radius_meters.toLocaleString("en-US")} m` : "—"}
                    </>
                  ) : (
                    "Polygon boundary"
                  )}
                </Td>
                <Td>
                  <Badge tone={a.is_active ? "warn" : "neutral"}>{a.is_active ? "Active" : "Inactive"}</Badge>
                </Td>
                <Td className="text-xs text-ivory-400">{timeAgo(a.created_at)}</Td>
                <Td>
                  <AreaActiveToggle id={a.id} active={a.is_active} />
                </Td>
              </tr>
            );
          })}
        </AdminTable>
      )}
    </>
  );
}
