import { Search } from "lucide-react";
import { getSessionUser } from "@/lib/supabase/server";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { AdminHeader, AdminTable, Td, Badge, FilterPills, AdminPagination } from "@/components/admin/AdminShell";
import { UserActions } from "@/components/admin/ActionButtons";
import { formatDate, timeAgo } from "@/lib/format";

export const metadata = { title: "Users" };

const LIMIT = 25;

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string; offset?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const filter = sp.filter === "blocked" || sp.filter === "admins" ? sp.filter : "";
  const offset = Math.max(0, Number(sp.offset) || 0);
  const { supabase, user } = await getSessionUser();

  let query = supabase.from("profiles").select("*").order("created_at", { ascending: false }).range(offset, offset + LIMIT);
  if (q) query = query.ilike("display_name", `%${q.replace(/[%_]/g, "")}%`);
  if (filter === "blocked") query = query.eq("is_blocked", true);
  if (filter === "admins") query = query.eq("is_admin", true);
  const { data, error } = await query;
  const rows = (data ?? []).slice(0, LIMIT);
  const hasMore = (data?.length ?? 0) > LIMIT;

  return (
    <>
      <AdminHeader title="Users" body="Profiles on the platform. Blocking a user prevents them from signing in and contributing; the reason is kept on the profile." />
      <form action="/admin/users" method="get" role="search" className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        {filter && <input type="hidden" name="filter" value={filter} />}
        <label htmlFor="q" className="sr-only">
          Search by display name
        </label>
        <input id="q" name="q" defaultValue={q} placeholder="Search by display name" className="input sm:max-w-sm" />
        <button type="submit" className="btn-secondary">
          <Search size={14} aria-hidden /> Search
        </button>
      </form>
      <div className="mb-4">
        <FilterPills
          basePath="/admin/users"
          param="filter"
          current={filter}
          keep={{ q: q || undefined }}
          options={[
            { value: "", label: "All" },
            { value: "admins", label: "Administrators" },
            { value: "blocked", label: "Blocked" },
          ]}
        />
      </div>
      {error && <Alert kind="error" className="mb-4">Could not load users. {error.message}</Alert>}
      {rows.length === 0 ? (
        <p className="text-sm text-ivory-500">No users match.</p>
      ) : (
        <AdminTable head={["User", "Flags", "Joined", "Updated", "Actions"]}>
          {rows.map((p) => (
            <tr key={p.id}>
              <Td>
                <div className="flex items-center gap-3">
                  <Avatar path={p.avatar_path} name={p.display_name || "User"} size={36} />
                  <div className="min-w-0">
                    <p className="text-ivory-50">
                      {p.display_name || <span className="text-ivory-500">No name</span>}
                      {p.id === user?.id && <span className="ml-2 text-xs text-ivory-500">(you)</span>}
                    </p>
                    <p className="truncate font-mono text-[11px] text-ivory-500">{p.id}</p>
                  </div>
                </div>
                {p.is_blocked && p.blocked_reason && <p className="mt-1 text-xs text-danger-400">Blocked: {p.blocked_reason}</p>}
              </Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  {p.is_admin && <Badge tone="good">Admin</Badge>}
                  {p.is_blocked && <Badge tone="bad">Blocked</Badge>}
                  {!p.is_admin && !p.is_blocked && <span className="text-xs text-ivory-500">—</span>}
                </div>
              </Td>
              <Td className="text-xs text-ivory-400">{formatDate(p.created_at)}</Td>
              <Td className="text-xs text-ivory-400">{timeAgo(p.updated_at)}</Td>
              <Td>
                <UserActions userId={p.id} isBlocked={p.is_blocked} isAdmin={p.is_admin} isSelf={p.id === user?.id} />
              </Td>
            </tr>
          ))}
        </AdminTable>
      )}
      <AdminPagination basePath="/admin/users" offset={offset} limit={LIMIT} hasMore={hasMore} keep={{ q: q || undefined, filter: filter || undefined }} />
    </>
  );
}
