"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Trash2, Users, X } from "lucide-react";
import { FamilyGroupSelect, type FamilyGroupOption } from "@/components/create/FamilyGroupSelect";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { addFamilyRelationship, deleteFamilyRelationship, setMemorialFamilyGroup } from "@/lib/actions/memorial";
import { lifeYears } from "@/lib/format";
import { RELATIONSHIP_LABELS } from "@/lib/site";
import type { FamilyGroup, FamilyOfRow, Memorial, RelationshipType, SearchResult } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { planAllows, PlanNotice, SaveBar, Section } from "./shared";

const TYPES: RelationshipType[] = ["parent", "child", "spouse", "sibling", "grandparent", "grandchild", "other"];

export function FamilyTab({
  memorial,
  family,
  familyGroup,
  familyGroups,
  limits,
}: {
  memorial: Memorial;
  family: FamilyOfRow[];
  familyGroup: FamilyGroup | null;
  familyGroups: FamilyGroupOption[];
  limits: Record<string, unknown>;
}) {
  const router = useRouter();
  const allowed = planAllows(limits, "family_connections");
  const [rows, setRows] = useState(family);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<SearchResult | null>(null);
  const [type, setType] = useState<RelationshipType>("parent");
  const [label, setLabel] = useState("");

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`, { signal: ctrl.signal });
        const json = (await r.json()) as { results?: SearchResult[] };
        setResults((json.results ?? []).filter((x) => x.id !== memorial.id));
      } catch {
        /* aborted or failed */
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query, memorial.id]);

  function connect() {
    if (!picked) return;
    setError(null);
    startTransition(async () => {
      const res = await addFamilyRelationship(memorial.id, picked.id, type, label.trim() || null, memorial.slug);
      if (!res.ok || !res.data) {
        setError(res.ok ? "Could not connect the memorials." : res.error);
        return;
      }
      const created = res.data;
      setRows((r) => [
        ...r,
        {
          relationship_id: created.id,
          relationship_type: type,
          label: label.trim() || null,
          direction: "outgoing",
          id: picked.id,
          slug: picked.slug,
          full_name: picked.full_name,
          birth_year: picked.birth_year,
          death_year: picked.death_year,
          profile_image_path: picked.profile_image_path,
          privacy: "public",
          status: "published",
        },
      ]);
      setPicked(null);
      setQuery("");
      setLabel("");
      router.refresh();
    });
  }

  function remove(row: FamilyOfRow) {
    if (!window.confirm(`Remove the connection to ${row.full_name}?`)) return;
    setRows((r) => r.filter((x) => x.relationship_id !== row.relationship_id));
    startTransition(async () => {
      const res = await deleteFamilyRelationship({ id: row.relationship_id, slug: memorial.slug });
      if (!res.ok) {
        setError(res.error);
        setRows((r) => [...r, row]);
      } else router.refresh();
    });
  }

  // Family group
  const [groupId, setGroupId] = useState<string | null>(memorial.family_group_id);
  const [groupSaved, setGroupSaved] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [groupPending, startGroup] = useTransition();
  const currentGroupName = familyGroups.find((g) => g.id === groupId)?.name ?? (groupId === familyGroup?.id ? familyGroup?.name : null);

  function saveGroup() {
    setGroupSaved(false);
    setGroupError(null);
    startGroup(async () => {
      const res = await setMemorialFamilyGroup(memorial.id, groupId, memorial.slug);
      if (!res.ok) {
        setGroupError(res.error);
        return;
      }
      setGroupSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {!allowed && <PlanNotice feature="Family connections" />}

      <Section title="Family connections" description="Link this memorial to parents, children, spouses and siblings who also have memorials. Connections appear on both memorial pages.">
        {error && (
          <Alert kind="error" className="mb-4">
            {error}
          </Alert>
        )}
        {rows.length === 0 ? (
          <EmptyState title="No family connections yet" body="Search for a relative's memorial below to connect them." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2" aria-label="Connected memorials">
            {rows.map((row) => (
              <li key={row.relationship_id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-navy-950/40 p-3">
                <Avatar path={row.profile_image_path} name={row.full_name} size={44} />
                <div className="min-w-0 flex-1">
                  <Link href={`/memorial/${row.slug}`} className="block truncate text-ivory-100 hover:text-gold-300">
                    {row.full_name}
                  </Link>
                  <p className="text-xs text-ivory-500">
                    {row.label || RELATIONSHIP_LABELS[row.relationship_type]}
                    {lifeYears(row.birth_year, row.death_year) && ` · ${lifeYears(row.birth_year, row.death_year)}`}
                  </p>
                </div>
                <button type="button" className="btn-ghost px-2.5 py-1.5 text-danger-400" onClick={() => remove(row)} disabled={pending} aria-label={`Remove connection to ${row.full_name}`}>
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 rounded-2xl border border-white/10 bg-navy-950/40 p-4">
          <p className="eyebrow mb-3">Add a connection</p>
          {!picked ? (
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ivory-500" aria-hidden />
              <input
                className="input pl-10"
                placeholder="Search memorials by name…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search memorials"
                aria-autocomplete="list"
                aria-controls="family-search-results"
                disabled={!allowed}
              />
              {searching && <Spinner className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2" />}
              {results.length > 0 && (
                <ul id="family-search-results" role="listbox" className="absolute z-10 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-white/10 bg-navy-900 p-1 shadow-soft">
                  {results.map((r) => (
                    <li key={r.id} role="option" aria-selected={false}>
                      <button type="button" className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-white/5" onClick={() => setPicked(r)}>
                        <Avatar path={r.profile_image_path} name={r.full_name} size={32} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-ivory-100">{r.full_name}</span>
                          <span className="block text-xs text-ivory-500">{[lifeYears(r.birth_year, r.death_year), r.place_name].filter(Boolean).join(" · ")}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {query.trim().length >= 2 && !searching && results.length === 0 && <p className="mt-2 text-xs text-ivory-500">No published memorials match that name.</p>}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-gold-400/30 bg-gold-400/5 p-3">
                <Avatar path={picked.profile_image_path} name={picked.full_name} size={36} />
                <span className="min-w-0 flex-1 truncate text-sm text-ivory-100">{picked.full_name}</span>
                <button type="button" className="btn-ghost px-2 py-1" onClick={() => setPicked(null)} aria-label="Choose a different memorial">
                  <X size={15} />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="rel-type">
                    {picked.full_name.split(" ")[0]} is {memorial.first_name}&apos;s…
                  </label>
                  <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Relationship type" id="rel-type">
                    {TYPES.map((t) => (
                      <button key={t} type="button" role="radio" aria-checked={type === t} onClick={() => setType(t)} className={cn("rounded-full border px-3 py-1 text-xs transition", type === t ? "border-gold-400 bg-gold-400 text-navy-950" : "border-white/15 text-ivory-300 hover:border-white/30")}>
                        {RELATIONSHIP_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="rel-label">
                    Custom label <span className="normal-case tracking-normal text-ivory-500">(optional)</span>
                  </label>
                  <input id="rel-label" className="input" placeholder="e.g. Mother, Stepfather, Twin" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={80} />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="button" className="btn-primary" onClick={connect} disabled={pending}>
                  {pending ? "Connecting…" : "Connect memorials"}
                </button>
              </div>
            </div>
          )}
        </div>
      </Section>

      <Section title="Family memorial area" description="Assign this memorial to a family group so related memorials can rest close together and be shown as one family on the map.">
        {currentGroupName && (
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-sage-500/40 bg-sage-500/10 px-3 py-1 text-xs text-sage-300">
            <Users size={13} aria-hidden /> Part of {currentGroupName}
          </p>
        )}
        <FamilyGroupSelect value={groupId} onChange={(id) => setGroupId(id)} />
        <SaveBar pending={groupPending} saved={groupSaved} error={groupError} onSave={saveGroup} label="Save family group" disabled={groupId === memorial.family_group_id && !groupSaved} />
      </Section>
    </div>
  );
}
