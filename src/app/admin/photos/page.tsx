import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ModerationStatus } from "@/lib/supabase/types";
import { Alert } from "@/components/ui/Alert";
import { AdminHeader, FilterPills, AdminPagination, Badge } from "@/components/admin/AdminShell";
import { PhotoActions } from "@/components/admin/ActionButtons";
import { imageUrl } from "@/lib/storage";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "Photos" };

const LIMIT = 24;
const STATUSES: ModerationStatus[] = ["approved", "pending", "hidden"];

export default async function AdminPhotosPage({ searchParams }: { searchParams: Promise<{ status?: string; offset?: string }> }) {
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as ModerationStatus) ? (sp.status as ModerationStatus) : "";
  const offset = Math.max(0, Number(sp.offset) || 0);
  const supabase = await createSupabaseServerClient();

  let query = supabase.from("memorial_photos").select("id, memorial_id, storage_path, caption, status, created_at").order("created_at", { ascending: false }).range(offset, offset + LIMIT);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  const rows = (data ?? []).slice(0, LIMIT);
  const hasMore = (data?.length ?? 0) > LIMIT;

  const memorialIds = Array.from(new Set(rows.map((r) => r.memorial_id)));
  const { data: memorials } = memorialIds.length ? await supabase.from("memorials").select("id, slug, full_name").in("id", memorialIds) : { data: [] as { id: string; slug: string; full_name: string }[] };
  const memorialById = new Map((memorials ?? []).map((m) => [m.id, m]));

  return (
    <>
      <AdminHeader title="Photos" body="The most recently uploaded photos across all memorials. Hide a photo to take it off the memorial without deleting it." />
      <div className="mb-4">
        <FilterPills basePath="/admin/photos" param="status" current={status} options={[{ value: "", label: "All" }, ...STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))]} />
      </div>
      {error && <Alert kind="error" className="mb-4">Could not load photos. {error.message}</Alert>}
      {rows.length === 0 ? (
        <p className="text-sm text-ivory-500">No photos to show.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => {
            const m = memorialById.get(p.memorial_id);
            const src = imageUrl(p.storage_path, { width: 600, height: 400, quality: 70 });
            return (
              <li key={p.id} className="card overflow-hidden">
                <div className="relative aspect-[3/2] bg-navy-950">
                  {src && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={p.caption || (m ? `Photo on the memorial of ${m.full_name}` : "Memorial photo")} className={`h-full w-full object-cover ${p.status === "hidden" ? "opacity-40" : ""}`} loading="lazy" />
                  )}
                  <span className="absolute left-2 top-2">
                    <Badge tone={p.status === "approved" ? "good" : p.status === "hidden" ? "warn" : "neutral"}>{p.status}</Badge>
                  </span>
                </div>
                <div className="p-4">
                  {m ? (
                    <Link href={`/memorial/${m.slug}#gallery`} className="inline-flex items-center gap-1 text-ivory-50 hover:text-gold-200">
                      {m.full_name} <ExternalLink size={12} aria-hidden />
                    </Link>
                  ) : (
                    <p className="text-ivory-500">Memorial unavailable</p>
                  )}
                  {p.caption && <p className="mt-1 text-xs text-ivory-400">{p.caption}</p>}
                  <p className="mt-1 text-xs text-ivory-500">Uploaded {timeAgo(p.created_at)}</p>
                  <div className="mt-3">
                    <PhotoActions id={p.id} slug={m?.slug ?? ""} status={p.status} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <AdminPagination basePath="/admin/photos" offset={offset} limit={LIMIT} hasMore={hasMore} keep={{ status: status || undefined }} />
    </>
  );
}
