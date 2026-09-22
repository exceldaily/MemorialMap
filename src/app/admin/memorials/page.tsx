import Link from "next/link";
import { ExternalLink, Search } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { MemorialStatus } from "@/lib/supabase/types";
import { Alert } from "@/components/ui/Alert";
import { AdminHeader, AdminTable, Td, Badge, FilterPills, AdminPagination } from "@/components/admin/AdminShell";
import { MemorialStatusActions } from "@/components/admin/ActionButtons";
import { lifeYears, timeAgo, compactNumber } from "@/lib/format";

export const metadata = { title: "Memorials" };

const LIMIT = 25;
const STATUSES: MemorialStatus[] = ["draft", "published", "suspended", "removed"];
const TONE: Record<MemorialStatus, "neutral" | "good" | "warn" | "bad"> = { draft: "neutral", published: "good", suspended: "warn", removed: "bad" };

export default async function AdminMemorialsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; offset?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const status = STATUSES.includes(sp.status as MemorialStatus) ? (sp.status as MemorialStatus) : "";
  const offset = Math.max(0, Number(sp.offset) || 0);
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("memorials")
    .select("id, slug, full_name, birth_year, death_year, status, privacy, owner_id, view_count, memories_count, photos_count, is_demo, suspended_reason, updated_at")
    .order("updated_at", { ascending: false })
    .range(offset, offset + LIMIT);
  if (q) query = query.ilike("full_name", `%${q.replace(/[%_]/g, "")}%`);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  const rows = (data ?? []).slice(0, LIMIT);
  const hasMore = (data?.length ?? 0) > LIMIT;
  const keep = { q: q || undefined, status: status || undefined };

  return (
    <>
      <AdminHeader title="Memorials" body="Search, suspend, remove or restore memorials. Owners are shown the reason you provide." />
      <form action="/admin/memorials" method="get" role="search" className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        {status && <input type="hidden" name="status" value={status} />}
        <label htmlFor="q" className="sr-only">
          Search by name
        </label>
        <input id="q" name="q" defaultValue={q} placeholder="Search by name" className="input sm:max-w-sm" />
        <button type="submit" className="btn-secondary">
          <Search size={14} aria-hidden /> Search
        </button>
      </form>
      <div className="mb-4">
        <FilterPills basePath="/admin/memorials" param="status" current={status} keep={{ q: q || undefined }} options={[{ value: "", label: "All" }, ...STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))]} />
      </div>
      {error && <Alert kind="error" className="mb-4">Could not load memorials. {error.message}</Alert>}
      {rows.length === 0 ? (
        <p className="text-sm text-ivory-500">No memorials match.</p>
      ) : (
        <AdminTable head={["Memorial", "Status", "Privacy", "Activity", "Updated", "Actions"]}>
          {rows.map((m) => (
            <tr key={m.id}>
              <Td>
                <Link href={`/memorial/${m.slug}`} className="inline-flex items-center gap-1 text-ivory-50 hover:text-gold-200">
                  {m.full_name} <ExternalLink size={12} aria-hidden />
                </Link>
                <p className="text-xs text-ivory-500">
                  {lifeYears(m.birth_year, m.death_year) || "No dates"}
                  {m.is_demo && " · demo"}
                </p>
                {m.suspended_reason && <p className="mt-1 text-xs text-gold-300">Reason: {m.suspended_reason}</p>}
              </Td>
              <Td>
                <Badge tone={TONE[m.status]}>{m.status}</Badge>
              </Td>
              <Td className="text-xs text-ivory-400">{m.privacy}</Td>
              <Td className="text-xs text-ivory-400">
                {compactNumber(m.view_count)} views · {compactNumber(m.memories_count)} memories · {compactNumber(m.photos_count)} photos
              </Td>
              <Td className="text-xs text-ivory-400">{timeAgo(m.updated_at)}</Td>
              <Td>
                <MemorialStatusActions id={m.id} slug={m.slug} status={m.status} />
              </Td>
            </tr>
          ))}
        </AdminTable>
      )}
      <AdminPagination basePath="/admin/memorials" offset={offset} limit={LIMIT} hasMore={hasMore} keep={keep} />
    </>
  );
}
