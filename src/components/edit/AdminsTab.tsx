"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck, Trash2, UserPlus, X } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { addMemorialAdmin, removeMemorialAdmin, searchProfiles, type MemorialAdminWithProfile, type ProfileMatch } from "@/lib/actions/memorial";
import type { Memorial } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { planNumber, Section } from "./shared";

type Role = "administrator" | "contributor";

const ROLE_INFO: Record<Role, { title: string; body: string }> = {
  administrator: { title: "Administrator", body: "Can edit details, manage photos, moderate memories and move the location. Cannot change privacy, administrators or delete." },
  contributor: { title: "Contributor", body: "Can add photos and share memories, and can view the memorial even when it is private." },
};

export function AdminsTab({ memorial, admins: initial, limits }: { memorial: Memorial; admins: MemorialAdminWithProfile[]; limits: Record<string, unknown> }) {
  const router = useRouter();
  const [admins, setAdmins] = useState(initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileMatch[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<ProfileMatch | null>(null);
  const [role, setRole] = useState<Role>("administrator");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const maxAdmins = planNumber(limits, "max_admins");
  const atLimit = maxAdmins !== null && admins.length >= maxAdmins;

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let alive = true;
    const t = setTimeout(async () => {
      setSearching(true);
      const res = await searchProfiles(q);
      if (!alive) return;
      setResults(res.ok ? (res.data ?? []).filter((p) => !admins.some((a) => a.user_id === p.id)) : []);
      setSearching(false);
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query, admins]);

  function add() {
    const who = picked?.id ?? query.trim();
    if (!who) return;
    setError(null);
    startTransition(async () => {
      const res = await addMemorialAdmin(memorial.id, who, role, memorial.slug);
      if (!res.ok || !res.data) {
        setError(res.ok ? "Could not add that person." : res.error);
        return;
      }
      const a = res.data;
      setAdmins((l) => [...l, a]);
      setPicked(null);
      setQuery("");
      router.refresh();
    });
  }

  function remove(a: MemorialAdminWithProfile) {
    if (!window.confirm(`Remove ${a.profile?.display_name ?? "this person"} from the memorial?`)) return;
    setAdmins((l) => l.filter((x) => x.id !== a.id));
    startTransition(async () => {
      const res = await removeMemorialAdmin({ id: a.id, slug: memorial.slug });
      if (!res.ok) {
        setError(res.error);
        setAdmins((l) => [...l, a]);
      } else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Section title="People who help" description="Invite family or friends to help care for this memorial. You remain the owner.">
        {error && (
          <Alert kind="error" className="mb-4">
            {error}
          </Alert>
        )}
        {admins.length === 0 ? (
          <EmptyState title="Just you for now" body="Add an administrator or contributor below so others can help." />
        ) : (
          <ul className="divide-y divide-white/8" aria-label="Administrators and contributors">
            {admins.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-3">
                <Avatar path={a.profile?.avatar_path} name={a.profile?.display_name ?? "Member"} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ivory-100">{a.profile?.display_name ?? "Unknown member"}</p>
                  <p className="text-xs capitalize text-ivory-500">{a.role}</p>
                </div>
                <button type="button" className="btn-ghost px-2.5 py-1.5 text-danger-400" onClick={() => remove(a)} disabled={pending} aria-label={`Remove ${a.profile?.display_name ?? "member"}`}>
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Add someone" description="Search by the display name they use on this site, or paste their profile id from their account page.">
        {atLimit && <Alert kind="warning" className="mb-4">Your current plan allows {maxAdmins} additional {maxAdmins === 1 ? "person" : "people"}. Remove someone to add another, or upgrade your plan.</Alert>}
        <div className="space-y-4">
          {!picked ? (
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ivory-500" aria-hidden />
              <input className="input pl-10" placeholder="Display name or profile id…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search people" aria-controls="admin-search-results" disabled={atLimit} />
              {searching && <Spinner className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />}
              {results.length > 0 && (
                <ul id="admin-search-results" role="listbox" className="absolute z-10 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-white/10 bg-navy-900 p-1 shadow-soft">
                  {results.map((p) => (
                    <li key={p.id} role="option" aria-selected={false}>
                      <button type="button" className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-white/5" onClick={() => setPicked(p)}>
                        <Avatar path={p.avatar_path} name={p.display_name} size={30} />
                        <span className="truncate text-sm text-ivory-100">{p.display_name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {query.trim().length >= 2 && !searching && results.length === 0 && <p className="mt-2 text-xs text-ivory-500">No one found with that name. They may need to sign up first.</p>}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-gold-400/30 bg-gold-400/5 p-3">
              <Avatar path={picked.avatar_path} name={picked.display_name} size={36} />
              <span className="min-w-0 flex-1 truncate text-sm text-ivory-100">{picked.display_name}</span>
              <button type="button" className="btn-ghost px-2 py-1" onClick={() => setPicked(null)} aria-label="Choose a different person">
                <X size={15} />
              </button>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Role">
            {(Object.keys(ROLE_INFO) as Role[]).map((r) => (
              <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => setRole(r)} className={cn("flex items-start gap-3 rounded-2xl border p-4 text-left transition", role === r ? "border-gold-400/70 bg-gold-400/10" : "border-white/10 bg-navy-950/40 hover:border-white/25")}>
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-gold-400" aria-hidden />
                <span>
                  <span className="block text-sm font-medium text-ivory-100">{ROLE_INFO[r].title}</span>
                  <span className="block text-xs text-ivory-400">{ROLE_INFO[r].body}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <button type="button" className="btn-primary" onClick={add} disabled={pending || atLimit || (!picked && query.trim().length < 2)}>
              {pending ? <Spinner className="h-4 w-4 border-navy-900/40 border-t-navy-900" /> : <UserPlus size={16} />} Add {ROLE_INFO[role].title.toLowerCase()}
            </button>
          </div>
        </div>
      </Section>
    </div>
  );
}
