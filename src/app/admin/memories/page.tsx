import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ModerationStatus } from "@/lib/supabase/types";
import { Alert } from "@/components/ui/Alert";
import { AdminHeader, FilterPills, AdminPagination } from "@/components/admin/AdminShell";
import { PendingMemories, type ModerationMemory } from "@/components/dashboard/PendingMemories";

export const metadata = { title: "Memories" };

const LIMIT = 25;
const STATUSES: ModerationStatus[] = ["pending", "hidden", "approved"];

export default async function AdminMemoriesPage({ searchParams }: { searchParams: Promise<{ status?: string; offset?: string }> }) {
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as ModerationStatus) ? (sp.status as ModerationStatus) : "pending";
  const offset = Math.max(0, Number(sp.offset) || 0);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("memories")
    .select("id, memorial_id, author_id, relationship, body, photo_path, status, created_at")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .range(offset, offset + LIMIT);
  const rows = (data ?? []).slice(0, LIMIT);
  const hasMore = (data?.length ?? 0) > LIMIT;

  const memorialIds = Array.from(new Set(rows.map((r) => r.memorial_id)));
  const authorIds = Array.from(new Set(rows.map((r) => r.author_id)));
  const [{ data: memorials }, { data: authors }] = await Promise.all([
    memorialIds.length ? supabase.from("memorials").select("id, slug, full_name").in("id", memorialIds) : Promise.resolve({ data: [] as { id: string; slug: string; full_name: string }[] }),
    authorIds.length ? supabase.from("profiles").select("id, display_name").in("id", authorIds) : Promise.resolve({ data: [] as { id: string; display_name: string }[] }),
  ]);
  const memorialById = new Map((memorials ?? []).map((m) => [m.id, m]));
  const authorById = new Map((authors ?? []).map((a) => [a.id, a]));

  const items: ModerationMemory[] = rows.map((r) => {
    const m = memorialById.get(r.memorial_id);
    return {
      id: r.id,
      body: r.body,
      relationship: r.relationship,
      photo_path: r.photo_path,
      created_at: r.created_at,
      slug: m?.slug ?? "",
      full_name: m?.full_name ?? "Unknown memorial",
      author_name: authorById.get(r.author_id)?.display_name ?? null,
      status: r.status,
    };
  });

  return (
    <>
      <AdminHeader title="Memories" body="Memories shared by visitors across the platform. Approve, hide or delete them here; memorial owners moderate their own memorials from the dashboard." />
      <div className="mb-4">
        <FilterPills basePath="/admin/memories" param="status" current={status} options={STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} />
      </div>
      {error && <Alert kind="error" className="mb-4">Could not load memories. {error.message}</Alert>}
      <PendingMemories key={`${status}-${offset}`} items={items} emptyTitle={`No ${status} memories`} emptyBody="There is nothing here right now." />
      <AdminPagination basePath="/admin/memories" offset={offset} limit={LIMIT} hasMore={hasMore} keep={{ status }} />
    </>
  );
}
