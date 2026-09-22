"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { deleteMemorial } from "@/lib/actions/memorial";
import type { Memorial } from "@/lib/supabase/types";
import { Section } from "./shared";

export function DangerTab({ memorial }: { memorial: Memorial }) {
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const matches = confirm.trim().toLowerCase() === memorial.last_name.trim().toLowerCase();

  function remove() {
    if (!matches) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteMemorial(memorial.id);
      // deleteMemorial redirects on success; only failures return here.
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <div className="space-y-6">
      <Section title="Delete this memorial" description="This permanently removes the memorial, its photos, videos, timeline, memories and tributes, and releases its memorial location. This cannot be undone.">
        <Alert kind="warning" className="mb-5">
          <span className="flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
            <span>If you only want to keep the memorial from being found, change its privacy to Unlisted or Private in the Details tab instead.</span>
          </span>
        </Alert>
        <label className="label" htmlFor="confirm-delete">
          Type <span className="normal-case tracking-normal text-ivory-100">{memorial.last_name}</span> to confirm
        </label>
        <input id="confirm-delete" className="input max-w-sm" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" aria-describedby="confirm-delete-hint" />
        <p id="confirm-delete-hint" className="mt-1.5 text-xs text-ivory-500">
          The last name on the memorial, exactly as shown.
        </p>
        {error && (
          <Alert kind="error" className="mt-4">
            {error}
          </Alert>
        )}
        <div className="mt-5">
          <button type="button" className="btn-danger" onClick={remove} disabled={!matches || pending}>
            {pending ? <Spinner className="h-4 w-4" /> : <Trash2 size={16} />} Delete memorial permanently
          </button>
        </div>
      </Section>
    </div>
  );
}
