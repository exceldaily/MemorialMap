import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ReportStatus } from "@/lib/supabase/types";
import { REPORT_REASONS } from "@/lib/site";
import { Alert } from "@/components/ui/Alert";
import { AdminHeader, AdminTable, Td, Badge, FilterPills, AdminPagination } from "@/components/admin/AdminShell";
import { ReportActions } from "@/components/admin/ActionButtons";
import { timeAgo, truncate } from "@/lib/format";

export const metadata = { title: "Reports" };

const LIMIT = 25;
const STATUSES: ReportStatus[] = ["open", "reviewing", "resolved", "dismissed"];
const TONE: Record<ReportStatus, "neutral" | "good" | "warn" | "bad"> = { open: "warn", reviewing: "neutral", resolved: "good", dismissed: "neutral" };

export default async function AdminReportsPage({ searchParams }: { searchParams: Promise<{ status?: string; offset?: string }> }) {
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as ReportStatus) ? (sp.status as ReportStatus) : "open";
  const offset = Math.max(0, Number(sp.offset) || 0);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("reports").select("*").eq("status", status).order("created_at", { ascending: false }).range(offset, offset + LIMIT);
  const rows = (data ?? []).slice(0, LIMIT);
  const hasMore = (data?.length ?? 0) > LIMIT;

  // Manually join the reported memorials / memories so we can link to them.
  const memoryIds = rows.map((r) => r.memory_id).filter((v): v is string => Boolean(v));
  const photoIds = rows.map((r) => r.photo_id).filter((v): v is string => Boolean(v));
  const [{ data: memories }, { data: photos }] = await Promise.all([
    memoryIds.length ? supabase.from("memories").select("id, memorial_id, body").in("id", memoryIds) : Promise.resolve({ data: [] as { id: string; memorial_id: string; body: string }[] }),
    photoIds.length ? supabase.from("memorial_photos").select("id, memorial_id").in("id", photoIds) : Promise.resolve({ data: [] as { id: string; memorial_id: string }[] }),
  ]);
  const memoryById = new Map((memories ?? []).map((m) => [m.id, m]));
  const photoById = new Map((photos ?? []).map((p) => [p.id, p]));
  const memorialIds = Array.from(
    new Set([...rows.map((r) => r.memorial_id), ...(memories ?? []).map((m) => m.memorial_id), ...(photos ?? []).map((p) => p.memorial_id)].filter((v): v is string => Boolean(v))),
  );
  const { data: memorials } = memorialIds.length
    ? await supabase.from("memorials").select("id, slug, full_name, status").in("id", memorialIds)
    : { data: [] as { id: string; slug: string; full_name: string; status: string }[] };
  const memorialById = new Map((memorials ?? []).map((m) => [m.id, m]));
  const reasonLabel = (v: string) => REPORT_REASONS.find((r) => r.value === v)?.label ?? v;

  return (
    <>
      <AdminHeader title="Reports" body="Reports submitted by visitors. Mark them as reviewing while you look, then resolve or dismiss with a note." />
      <div className="mb-4">
        <FilterPills basePath="/admin/reports" param="status" current={status} options={STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} />
      </div>
      {error && <Alert kind="error" className="mb-4">Could not load reports. {error.message}</Alert>}
      {rows.length === 0 ? (
        <p className="text-sm text-ivory-500">No {status} reports.</p>
      ) : (
        <AdminTable head={["Reported", "Reason", "Details", "Status", "Submitted", "Actions"]}>
          {rows.map((r) => {
            const memory = r.memory_id ? memoryById.get(r.memory_id) : null;
            const photo = r.photo_id ? photoById.get(r.photo_id) : null;
            const memorialId = r.memorial_id ?? memory?.memorial_id ?? photo?.memorial_id ?? null;
            const memorial = memorialId ? memorialById.get(memorialId) : null;
            const target = r.memory_id ? "Memory" : r.photo_id ? "Photo" : "Memorial";
            return (
              <tr key={r.id}>
                <Td>
                  <p className="text-xs uppercase tracking-widest text-ivory-500">{target}</p>
                  {memorial ? (
                    <Link href={`/memorial/${memorial.slug}${r.memory_id ? "#memories" : r.photo_id ? "#gallery" : ""}`} className="inline-flex items-center gap-1 text-ivory-50 hover:text-gold-200">
                      {memorial.full_name} <ExternalLink size={12} aria-hidden />
                    </Link>
                  ) : (
                    <p className="text-ivory-500">Content no longer available</p>
                  )}
                  {memory && <p className="mt-1 text-xs italic text-ivory-400">“{truncate(memory.body, 100)}”</p>}
                </Td>
                <Td className="text-ivory-100">{reasonLabel(r.reason)}</Td>
                <Td className="max-w-xs text-xs text-ivory-400">
                  {r.details ? truncate(r.details, 200) : <span className="text-ivory-500">—</span>}
                  {r.reporter_email && <p className="mt-1 text-ivory-500">From {r.reporter_email}</p>}
                  {r.resolution_note && <p className="mt-1 text-sage-300">Note: {r.resolution_note}</p>}
                </Td>
                <Td>
                  <Badge tone={TONE[r.status]}>{r.status}</Badge>
                </Td>
                <Td className="text-xs text-ivory-400">{timeAgo(r.created_at)}</Td>
                <Td>
                  <ReportActions id={r.id} status={r.status} />
                </Td>
              </tr>
            );
          })}
        </AdminTable>
      )}
      <AdminPagination basePath="/admin/reports" offset={offset} limit={LIMIT} hasMore={hasMore} keep={{ status }} />
    </>
  );
}
