"use client";

import { useState, useTransition } from "react";
import { Check, EyeOff, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Alert } from "@/components/ui/Alert";
import { moderateMemory, deleteMemory } from "@/lib/actions/engagement";
import { imageUrl } from "@/lib/storage";
import { timeAgo } from "@/lib/format";
import type { ModerationStatus } from "@/lib/supabase/types";
import type { MemoryWithAuthor } from "./MemoriesSection";

/* eslint-disable @next/next/no-img-element -- user uploaded memory photos */

type Action = "approved" | "hidden" | "deleted";

function MemoryRow({ m, busy, act }: { m: MemoryWithAuthor; busy: boolean; act: (id: string, status: Action) => void }) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-white/8 bg-navy-950/40 p-4 sm:flex-row sm:items-start">
      <Avatar path={m.author?.avatar_path} name={m.author?.display_name ?? "Visitor"} size={36} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ivory-100">
          <span className="font-medium">{m.author?.display_name ?? "A visitor"}</span>
          {m.relationship && <span className="text-ivory-400"> · {m.relationship}</span>}
          <span className="text-ivory-500"> · {timeAgo(m.created_at)}</span>
        </p>
        <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ivory-300">{m.body}</p>
        {m.photo_path && <img src={imageUrl(m.photo_path, { width: 400, quality: 70 }) ?? ""} alt="Photo attached to this memory" className="mt-2 max-h-40 rounded-lg" loading="lazy" />}
      </div>
      <div className="flex shrink-0 flex-wrap gap-1.5">
        <button type="button" onClick={() => act(m.id, "approved")} disabled={busy} className="btn border border-sage-500/40 bg-sage-500/10 !px-3 !py-1.5 text-xs text-sage-300 hover:bg-sage-500/20">
          <Check size={14} aria-hidden /> {m.status === "hidden" ? "Restore" : "Approve"}
        </button>
        {m.status === "pending" && (
          <button type="button" onClick={() => act(m.id, "hidden")} disabled={busy} className="btn-secondary !px-3 !py-1.5 text-xs">
            <EyeOff size={14} aria-hidden /> Hide
          </button>
        )}
        <button type="button" onClick={() => act(m.id, "deleted")} disabled={busy} className="btn-danger !px-3 !py-1.5 text-xs">
          <Trash2 size={14} aria-hidden /> Delete
        </button>
      </div>
    </li>
  );
}

export function PendingMemoriesPanel({
  memories,
  slug,
  onChange,
}: {
  memories: MemoryWithAuthor[];
  slug: string;
  onChange: (id: string, status: ModerationStatus | "deleted") => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const pending = memories.filter((m) => m.status === "pending");
  const hidden = memories.filter((m) => m.status === "hidden");
  if (pending.length === 0 && hidden.length === 0) return null;

  const act = (id: string, status: Action) => {
    setError(null);
    setBusyId(id);
    startTransition(async () => {
      const res = status === "deleted" ? await deleteMemory({ id, slug }) : await moderateMemory({ id, slug, status });
      setBusyId(null);
      if (!res.ok) setError(res.error);
      else onChange(id, status);
    });
  };

  return (
    <div className="rounded-2xl border border-gold-400/25 bg-gold-400/5 p-5" role="region" aria-labelledby="pending-memories-heading">
      <h3 id="pending-memories-heading" className="text-xl text-ivory-50">
        Pending memories <span className="text-gold-300">({pending.length})</span>
      </h3>
      <p className="mt-1 text-sm text-ivory-400">Only you and other managers can see these until they are approved.</p>
      {error && (
        <Alert kind="error" className="mt-3">
          {error}
        </Alert>
      )}
      {pending.length > 0 && (
        <ul className="mt-4 space-y-3">
          {pending.map((m) => (
            <MemoryRow key={m.id} m={m} busy={busyId === m.id} act={act} />
          ))}
        </ul>
      )}
      {hidden.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-ivory-400 hover:text-ivory-200">Hidden memories ({hidden.length})</summary>
          <ul className="mt-3 space-y-3">
            {hidden.map((m) => (
              <MemoryRow key={m.id} m={m} busy={busyId === m.id} act={act} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
