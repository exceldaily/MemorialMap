"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { Plus, Users } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { createFamilyGroup, listMyFamilyGroups } from "@/lib/actions/memorial";
import { cn } from "@/lib/utils";

export type FamilyGroupOption = { id: string; name: string; slug: string };

/**
 * Select one of the user's family groups (owner or member) with an inline
 * "create new" form. Loads options client-side on mount.
 */
export function FamilyGroupSelect({
  value,
  onChange,
  label = "Family memorial area",
  allowCreate = true,
  className,
}: {
  value: string | null;
  onChange: (id: string | null, group?: FamilyGroupOption) => void;
  label?: string;
  allowCreate?: boolean;
  className?: string;
}) {
  const id = useId();
  const [groups, setGroups] = useState<FamilyGroupOption[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let alive = true;
    listMyFamilyGroups().then((res) => {
      if (!alive) return;
      if (res.ok) setGroups(res.data ?? []);
      else {
        setGroups([]);
        setError(res.error);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  function create() {
    if (!newName.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await createFamilyGroup(newName.trim());
      if (!res.ok || !res.data) {
        setError(res.ok ? "Could not create the family group." : res.error);
        return;
      }
      const g = { id: res.data.id, name: res.data.name, slug: res.data.slug };
      setGroups((prev) => [...(prev ?? []), g].sort((a, b) => a.name.localeCompare(b.name)));
      onChange(g.id, g);
      setNewName("");
      setCreating(false);
    });
  }

  return (
    <div className={className}>
      <label className="label" htmlFor={`${id}-select`}>
        {label} <span className="normal-case tracking-normal text-ivory-500">(optional)</span>
      </label>
      {groups === null ? (
        <div className="flex items-center gap-2 text-sm text-ivory-400">
          <Spinner className="h-4 w-4" /> Loading your family groups…
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Users size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ivory-500" aria-hidden />
            <select
              id={`${id}-select`}
              className={cn("input appearance-none pl-10")}
              value={value ?? ""}
              onChange={(e) => {
                const g = groups.find((x) => x.id === e.target.value);
                onChange(e.target.value || null, g);
              }}
            >
              <option value="">No family group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          {allowCreate && !creating && (
            <button type="button" className="btn-secondary" onClick={() => setCreating(true)}>
              <Plus size={15} /> New group
            </button>
          )}
        </div>
      )}
      {creating && (
        <div className="mt-3 rounded-xl border border-white/10 bg-navy-950/40 p-3">
          <label className="label" htmlFor={`${id}-new`}>
            Family group name
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id={`${id}-new`}
              className="input"
              placeholder="e.g. The Smith Family"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  create();
                }
              }}
            />
            <button type="button" className="btn-primary" onClick={create} disabled={pending || newName.trim().length < 2}>
              {pending ? <Spinner className="h-4 w-4 border-navy-900/40 border-t-navy-900" /> : "Create"}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setCreating(false)} disabled={pending}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <p className="mt-1.5 text-xs leading-relaxed text-ivory-500">
        Family groups let related memorials rest close together and are subtly linked on the map. You can change this later.
      </p>
      {error && (
        <Alert kind="error" className="mt-2">
          {error}
        </Alert>
      )}
    </div>
  );
}
