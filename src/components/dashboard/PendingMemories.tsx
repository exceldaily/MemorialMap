"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, EyeOff, Trash2 } from "lucide-react";
import { moderateMemory, deleteMemory } from "@/lib/actions/engagement";
import type { ModerationStatus } from "@/lib/supabase/types";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { imageUrl } from "@/lib/storage";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

export type ModerationMemory = {
  id: string;
  body: string;
  relationship: string | null;
  photo_path: string | null;
  created_at: string;
  slug: string;
  full_name: string;
  author_name: string | null;
  status?: ModerationStatus;
};

/**
 * Moderation list for memories. Used on the dashboard (pending only) and in
 * the admin area (pending + hidden). Actions run through the engagement server
 * actions so the same RLS rules apply everywhere.
 */
export function PendingMemories({ items, emptyTitle = "Nothing waiting for you", emptyBody = "When someone shares a memory on one of your memorials, it will appear here for your approval before it is shown." }: { items: ModerationMemory[]; emptyTitle?: string; emptyBody?: string }) {
  const router = useRouter();
  const [list, setList] = useState(items);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const run = (id: string, fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setBusy(id);
    setError(null);
    startTransition(async () => {
      const res = await fn();
      setBusy(null);
      if (!res.ok) {
        setError(res.error ?? "Something went wrong.");
        return;
      }
      setList((l) => l.filter((m) => m.id !== id));
      router.refresh();
    });
  };

  if (list.length === 0) return <EmptyState title={emptyTitle} body={emptyBody} />;

  return (
    <div className="space-y-4">
      {error && <Alert kind="error">{error}</Alert>}
      <ul className="space-y-4">
        {list.map((m) => {
          const photo = imageUrl(m.photo_path, { width: 400, height: 400, quality: 70 });
          const isBusy = busy === m.id;
          return (
            <li key={m.id} className={cn("card p-5", isBusy && "opacity-60")}>
              <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <p className="text-ivory-300">
                  <span className="text-ivory-100">{m.author_name ?? "Someone"}</span>
                  {m.relationship && <span className="text-ivory-500"> · {m.relationship}</span>}
                  <span className="text-ivory-500"> · on </span>
                  <Link href={`/memorial/${m.slug}`} className="text-gold-300 hover:text-gold-200">
                    {m.full_name}
                  </Link>
                </p>
                <p className="text-xs text-ivory-500">
                  {m.status && m.status !== "pending" && <span className="mr-2 rounded-full bg-white/8 px-2 py-0.5 uppercase tracking-widest">{m.status}</span>}
                  {timeAgo(m.created_at)}
                </p>
              </div>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row">
                <p className="prose-memorial flex-1 text-base">{m.body}</p>
                {photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt={`Photo shared with a memory of ${m.full_name}`} className="h-28 w-28 shrink-0 rounded-xl object-cover" loading="lazy" />
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" disabled={isBusy} onClick={() => run(m.id, () => moderateMemory({ id: m.id, slug: m.slug, status: "approved" }))} className="btn-primary px-4 py-2 text-xs">
                  {isBusy ? <Spinner className="h-3.5 w-3.5 border-navy-900/40 border-t-navy-900" /> : <Check size={14} aria-hidden />} Approve
                </button>
                <button type="button" disabled={isBusy} onClick={() => run(m.id, () => moderateMemory({ id: m.id, slug: m.slug, status: "hidden" }))} className="btn-secondary px-4 py-2 text-xs">
                  <EyeOff size={14} aria-hidden /> Hide
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => {
                    if (window.confirm("Delete this memory permanently?")) run(m.id, () => deleteMemory({ id: m.id, slug: m.slug }));
                  }}
                  className="btn-danger px-4 py-2 text-xs"
                >
                  <Trash2 size={14} aria-hidden /> Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
