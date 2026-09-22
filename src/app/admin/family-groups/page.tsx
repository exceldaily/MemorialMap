import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Alert } from "@/components/ui/Alert";
import { AdminHeader, AdminTable, Td, Badge, AdminPagination } from "@/components/admin/AdminShell";
import { timeAgo } from "@/lib/format";

export const metadata = { title: "Family groups" };

const LIMIT = 40;

export default async function AdminFamilyGroupsPage({ searchParams }: { searchParams: Promise<{ offset?: string }> }) {
  const sp = await searchParams;
  const offset = Math.max(0, Number(sp.offset) || 0);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from("family_groups").select("id, name, slug, description, owner_id, privacy, is_demo, created_at").order("created_at", { ascending: false }).range(offset, offset + LIMIT);
  const rows = (data ?? []).slice(0, LIMIT);
  const hasMore = (data?.length ?? 0) > LIMIT;

  const groupIds = rows.map((g) => g.id);
  const ownerIds = Array.from(new Set(rows.map((g) => g.owner_id)));
  const [{ data: memorials }, { data: owners }] = await Promise.all([
    groupIds.length ? supabase.from("memorials").select("id, family_group_id").in("family_group_id", groupIds) : Promise.resolve({ data: [] as { id: string; family_group_id: string | null }[] }),
    ownerIds.length ? supabase.from("profiles").select("id, display_name").in("id", ownerIds) : Promise.resolve({ data: [] as { id: string; display_name: string }[] }),
  ]);
  const countByGroup = new Map<string, number>();
  for (const m of memorials ?? []) if (m.family_group_id) countByGroup.set(m.family_group_id, (countByGroup.get(m.family_group_id) ?? 0) + 1);
  const ownerById = new Map((owners ?? []).map((o) => [o.id, o.display_name]));

  return (
    <>
      <AdminHeader title="Family groups" body="Family memorial areas created by users." />
      {error && <Alert kind="error" className="mb-4">Could not load family groups. {error.message}</Alert>}
      {rows.length === 0 ? (
        <p className="text-sm text-ivory-500">No family groups yet.</p>
      ) : (
        <AdminTable head={["Group", "Owner", "Memorials", "Privacy", "Created"]}>
          {rows.map((g) => (
            <tr key={g.id}>
              <Td>
                <Link href={`/family/${g.slug}`} className="inline-flex items-center gap-1 text-ivory-50 hover:text-gold-200">
                  {g.name} <ExternalLink size={12} aria-hidden />
                </Link>
                {g.description && <p className="text-xs text-ivory-500">{g.description}</p>}
                {g.is_demo && <Badge>Demo</Badge>}
              </Td>
              <Td className="text-ivory-300">{ownerById.get(g.owner_id) ?? <span className="font-mono text-xs text-ivory-500">{g.owner_id}</span>}</Td>
              <Td className="text-ivory-300">{countByGroup.get(g.id) ?? 0}</Td>
              <Td className="text-xs text-ivory-400">{g.privacy}</Td>
              <Td className="text-xs text-ivory-400">{timeAgo(g.created_at)}</Td>
            </tr>
          ))}
        </AdminTable>
      )}
      <AdminPagination basePath="/admin/family-groups" offset={offset} limit={LIMIT} hasMore={hasMore} />
    </>
  );
}
