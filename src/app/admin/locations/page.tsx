import Link from "next/link";
import { ExternalLink, MapPin } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Alert } from "@/components/ui/Alert";
import { AdminHeader, AdminTable, Td, AdminPagination } from "@/components/admin/AdminShell";
import { formatCoord, timeAgo } from "@/lib/format";

export const metadata = { title: "Locations" };

const LIMIT = 40;

export default async function AdminLocationsPage({ searchParams }: { searchParams: Promise<{ offset?: string }> }) {
  const sp = await searchParams;
  const offset = Math.max(0, Number(sp.offset) || 0);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("memorial_locations").select("*").order("created_at", { ascending: false }).range(offset, offset + LIMIT);
  const rows = (data ?? []).slice(0, LIMIT);
  const hasMore = (data?.length ?? 0) > LIMIT;
  const memorialIds = rows.map((r) => r.memorial_id);
  const { data: memorials } = memorialIds.length
    ? await supabase.from("memorials").select("id, slug, full_name, status").in("id", memorialIds)
    : { data: [] as { id: string; slug: string; full_name: string; status: string }[] };
  const memorialById = new Map((memorials ?? []).map((m) => [m.id, m]));

  return (
    <>
      <AdminHeader title="Memorial locations" body="Every reserved memorial location, newest first. Locations are virtual markers and never imply any connection to the physical place." />
      {error && <Alert kind="error" className="mb-4">Could not load locations. {error.message}</Alert>}
      {rows.length === 0 ? (
        <p className="text-sm text-ivory-500">No memorial locations yet.</p>
      ) : (
        <AdminTable head={["Memorial", "Place", "Coordinates", "Spacing", "Reserved", "Map"]}>
          {rows.map((l) => {
            const m = memorialById.get(l.memorial_id);
            return (
              <tr key={l.id}>
                <Td>
                  {m ? (
                    <Link href={`/memorial/${m.slug}`} className="inline-flex items-center gap-1 text-ivory-50 hover:text-gold-200">
                      {m.full_name} <ExternalLink size={12} aria-hidden />
                    </Link>
                  ) : (
                    <span className="text-ivory-500">Memorial not visible</span>
                  )}
                  {m && m.status !== "published" && <p className="text-xs text-ivory-500">{m.status}</p>}
                </Td>
                <Td className="text-ivory-300">{l.place_name ?? <span className="text-ivory-500">—</span>}</Td>
                <Td className="font-mono text-xs text-ivory-400">
                  {formatCoord(l.latitude, "lat")}
                  <br />
                  {formatCoord(l.longitude, "lng")}
                </Td>
                <Td className="text-xs text-ivory-400">{l.spacing_meters != null ? `${l.spacing_meters} m` : "default"}</Td>
                <Td className="text-xs text-ivory-400">{timeAgo(l.created_at)}</Td>
                <Td>
                  <Link href={`/map?lat=${l.latitude}&lng=${l.longitude}&z=15${m ? `&focus=${m.slug}` : ""}`} className="btn-secondary px-3 py-1.5 text-xs">
                    <MapPin size={13} aria-hidden /> Open
                  </Link>
                </Td>
              </tr>
            );
          })}
        </AdminTable>
      )}
      <AdminPagination basePath="/admin/locations" offset={offset} limit={LIMIT} hasMore={hasMore} />
    </>
  );
}
