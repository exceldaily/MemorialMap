"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { createFamilyGroup } from "@/lib/actions/memorial";

export function FamilyGroupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Give the family group a name.");
      return;
    }
    startTransition(async () => {
      const res = await createFamilyGroup(name.trim(), description.trim() || null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/dashboard?tab=family");
    });
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-6 sm:p-8" aria-label="Create a family group">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-400/40 bg-gold-400/10 text-gold-300" aria-hidden>
          <Users size={18} />
        </span>
        <p className="text-sm text-ivory-400">Family groups bring related memorials together and let them rest close to one another on the map.</p>
      </div>
      <div>
        <label className="label" htmlFor="fg-name">
          Family group name <span className="text-gold-400">*</span>
        </label>
        <input id="fg-name" className="input" placeholder="e.g. The Smith Family" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required autoFocus />
      </div>
      <div>
        <label className="label" htmlFor="fg-desc">
          Description <span className="normal-case tracking-normal text-ivory-500">(optional)</span>
        </label>
        <textarea id="fg-desc" className="input min-h-[7rem] resize-y" placeholder="A few words about this family — origins, places, what binds them." value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} />
      </div>
      {error && <Alert kind="error">{error}</Alert>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" className="btn-ghost" onClick={() => router.back()} disabled={pending}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={pending || name.trim().length < 2}>
          {pending ? <Spinner className="h-4 w-4 border-navy-900/40 border-t-navy-900" /> : "Create family group"}
        </button>
      </div>
    </form>
  );
}
