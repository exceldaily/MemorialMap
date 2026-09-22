import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminStats } from "@/lib/supabase/types";
import { Alert } from "@/components/ui/Alert";
import { AdminHeader } from "@/components/admin/AdminShell";
import { compactNumber, timeAgo } from "@/lib/format";

export const metadata = { title: "Overview" };

const TILES: { key: keyof AdminStats; label: string; href: string; attention?: boolean }[] = [
  { key: "users", label: "Users", href: "/admin/users" },
  { key: "memorials", label: "Memorials", href: "/admin/memorials" },
  { key: "published", label: "Published", href: "/admin/memorials?status=published" },
  { key: "suspended", label: "Suspended", href: "/admin/memorials?status=suspended", attention: true },
  { key: "open_reports", label: "Open reports", href: "/admin/reports?status=open", attention: true },
  { key: "pending_memories", label: "Pending memories", href: "/admin/memories?status=pending", attention: true },
  { key: "photos", label: "Photos", href: "/admin/photos" },
  { key: "blocked_areas", label: "Blocked areas", href: "/admin/blocked-areas" },
  { key: "family_groups", label: "Family groups", href: "/admin/family-groups" },
];

export default async function AdminOverviewPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: stats, error }, { data: recent }] = await Promise.all([
    supabase.rpc("admin_stats"),
    supabase.from("activity_logs").select("id, action, entity_type, entity_id, created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  return (
    <>
      <AdminHeader title="Overview" body="A snapshot of the platform. Tiles that need attention are highlighted." />
      {error && <Alert kind="error" className="mb-6">Could not load statistics. {error.message}</Alert>}
      <ul className="grid gap-3 sm:grid-cols-3">
        {TILES.map((t) => {
          const value = stats?.[t.key] ?? 0;
          const hot = t.attention && value > 0;
          return (
            <li key={t.key}>
              <Link href={t.href} className={`card block p-5 transition-colors hover:border-gold-400/30 ${hot ? "border-gold-400/40" : ""}`}>
                <p className="text-[11px] uppercase tracking-widest text-ivory-500">{t.label}</p>
                <p className={`mt-1 font-display text-4xl ${hot ? "text-gold-300" : "text-ivory-50"}`}>{compactNumber(value)}</p>
              </Link>
            </li>
          );
        })}
      </ul>

      <section className="mt-10" aria-labelledby="recent-activity">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent-activity" className="text-2xl text-ivory-50">
            Recent activity
          </h2>
          <Link href="/admin/activity" className="text-sm text-gold-300 hover:text-gold-200">
            View all
          </Link>
        </div>
        {recent && recent.length > 0 ? (
          <ul className="card divide-y divide-white/5">
            {recent.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
                <span className="truncate text-ivory-200">
                  <span className="font-mono text-xs text-gold-300">{a.action}</span> <span className="text-ivory-500">· {a.entity_type}</span>
                </span>
                <span className="shrink-0 text-xs text-ivory-500">{timeAgo(a.created_at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ivory-500">No activity recorded yet.</p>
        )}
      </section>
    </>
  );
}
