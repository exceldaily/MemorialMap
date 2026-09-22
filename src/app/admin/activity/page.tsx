import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Alert } from "@/components/ui/Alert";
import { AdminHeader, AdminTable, Td } from "@/components/admin/AdminShell";
import { formatDate, timeAgo } from "@/lib/format";

export const metadata = { title: "Activity log" };

export default async function AdminActivityPage() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(100);
  const rows = data ?? [];
  const actorIds = Array.from(new Set(rows.map((r) => r.actor_id).filter((v): v is string => Boolean(v))));
  const { data: actors } = actorIds.length ? await supabase.from("profiles").select("id, display_name").in("id", actorIds) : { data: [] as { id: string; display_name: string }[] };
  const actorById = new Map((actors ?? []).map((a) => [a.id, a.display_name]));

  return (
    <>
      <AdminHeader title="Activity log" body="The latest 100 logged events. Administrative actions are recorded automatically." />
      {error && <Alert kind="error" className="mb-4">Could not load the activity log. {error.message}</Alert>}
      {rows.length === 0 ? (
        <p className="text-sm text-ivory-500">Nothing has been logged yet.</p>
      ) : (
        <AdminTable head={["When", "Actor", "Action", "Entity", "Details"]}>
          {rows.map((a) => {
            const meta = a.metadata && typeof a.metadata === "object" && !Array.isArray(a.metadata) ? a.metadata : null;
            const details = meta ? JSON.stringify(meta) : "";
            return (
              <tr key={a.id}>
                <Td className="whitespace-nowrap text-xs text-ivory-400">
                  <time dateTime={a.created_at} title={formatDate(a.created_at, { dateStyle: "medium", timeStyle: "short" })}>
                    {timeAgo(a.created_at)}
                  </time>
                </Td>
                <Td className="text-ivory-300">{a.actor_id ? actorById.get(a.actor_id) ?? <span className="font-mono text-xs text-ivory-500">{a.actor_id.slice(0, 8)}…</span> : <span className="text-ivory-500">system</span>}</Td>
                <Td className="font-mono text-xs text-gold-300">{a.action}</Td>
                <Td className="text-xs text-ivory-400">
                  {a.entity_type}
                  {a.entity_id && <span className="block font-mono text-[11px] text-ivory-500">{a.entity_id}</span>}
                </Td>
                <Td className="max-w-xs break-all font-mono text-[11px] text-ivory-500">{details && details !== "{}" ? details : "—"}</Td>
              </tr>
            );
          })}
        </AdminTable>
      )}
    </>
  );
}
