"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EyeOff, Flag } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Alert } from "@/components/ui/Alert";
import { moderateMemory } from "@/lib/actions/engagement";
import { imageUrl } from "@/lib/storage";
import { timeAgo } from "@/lib/format";
import type { MemorialBundle } from "@/lib/queries/memorial";
import type { ModerationStatus } from "@/lib/supabase/types";
import { SectionHeading } from "./SectionHeading";
import { MemoryForm } from "./MemoryForm";
import { PendingMemoriesPanel } from "./PendingMemoriesPanel";
import { ReportModal } from "./ReportModal";

/* eslint-disable @next/next/no-img-element -- user uploaded memory photos */

export type MemoryWithAuthor = MemorialBundle["memories"][number];

export function MemoriesSection({
  memorialId,
  slug,
  name,
  initialMemories,
  viewerId,
  canManage,
  authorName,
}: {
  memorialId: string;
  slug: string;
  name: string;
  initialMemories: MemoryWithAuthor[];
  viewerId: string | null;
  canManage: boolean;
  /** Display name of the signed-in viewer, used for the optimistic pending card. */
  authorName?: string | null;
}) {
  const router = useRouter();
  const [memories, setMemories] = useState(initialMemories);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [hideError, setHideError] = useState<string | null>(null);

  const approved = memories.filter((m) => m.status === "approved");
  const mine = viewerId ? memories.filter((m) => m.author_id === viewerId && m.status === "pending") : [];

  const onChange = useCallback(
    (id: string, status: ModerationStatus | "deleted") => {
      setMemories((prev) => (status === "deleted" ? prev.filter((m) => m.id !== id) : prev.map((m) => (m.id === id ? { ...m, status } : m))));
      router.refresh();
    },
    [router],
  );

  const hideApproved = async (id: string) => {
    setHideError(null);
    const res = await moderateMemory({ id, slug, status: "hidden" });
    if (!res.ok) setHideError(res.error);
    else onChange(id, "hidden");
  };

  const signedIn = Boolean(viewerId);

  return (
    <section id="memories" aria-labelledby="memories-heading" className="scroll-mt-32">
      <SectionHeading id="memories-heading" eyebrow="Shared by those who knew them" title="Memories" aside={approved.length > 0 ? `${approved.length} shared` : undefined} />

      {canManage && (
        <div className="mb-8">
          <PendingMemoriesPanel memories={memories} slug={slug} onChange={onChange} />
        </div>
      )}

      {hideError && (
        <Alert kind="error" className="mb-4">
          {hideError}
        </Alert>
      )}

      {approved.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <p className="font-display text-2xl text-ivory-100">No memories have been shared yet.</p>
          <p className="mt-2 text-sm text-ivory-400">Be the first to share a story about {name}.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {approved.map((m) => (
            <li key={m.id} className="card p-5 sm:p-6 animate-fade-up">
              <div className="flex items-start gap-4">
                <Avatar path={m.author?.avatar_path} name={m.author?.display_name ?? "Visitor"} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <p className="font-medium text-ivory-50">{m.author?.display_name ?? "A visitor"}</p>
                    {m.relationship && <p className="text-sm text-gold-300">{m.relationship}</p>}
                    <p className="text-xs text-ivory-500">
                      <time dateTime={m.created_at}>{timeAgo(m.created_at)}</time>
                    </p>
                  </div>
                  <p className="mt-2 whitespace-pre-line leading-relaxed text-ivory-200">{m.body}</p>
                  {m.photo_path && (
                    <img
                      src={imageUrl(m.photo_path, { width: 900, quality: 78 }) ?? ""}
                      alt={`Photo shared by ${m.author?.display_name ?? "a visitor"}`}
                      loading="lazy"
                      className="mt-4 max-h-[420px] w-auto max-w-full rounded-xl ring-1 ring-white/10"
                    />
                  )}
                  <div className="mt-3 flex gap-3 text-xs text-ivory-500">
                    {canManage && (
                      <button type="button" onClick={() => hideApproved(m.id)} className="inline-flex items-center gap-1 hover:text-ivory-200">
                        <EyeOff size={12} aria-hidden /> Hide
                      </button>
                    )}
                    <button type="button" onClick={() => setReportId(m.id)} className="inline-flex items-center gap-1 hover:text-ivory-200" aria-label="Report this memory">
                      <Flag size={12} aria-hidden /> Report
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {mine.length > 0 && (
        <ul className="mt-6 space-y-3" aria-label="Your memories awaiting approval">
          {mine.map((m) => (
            <li key={m.id} className="rounded-2xl border border-dashed border-gold-400/30 bg-gold-400/5 p-5">
              <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-gold-300">Awaiting approval</p>
              {m.relationship && <p className="text-sm text-ivory-400">{m.relationship}</p>}
              <p className="mt-1 whitespace-pre-line leading-relaxed text-ivory-200">{m.body}</p>
              {m.photo_path && <img src={imageUrl(m.photo_path, { width: 600, quality: 70 }) ?? ""} alt="Photo attached to your memory" className="mt-3 max-h-48 rounded-lg" loading="lazy" />}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10">
        {justSubmitted && (
          <Alert kind="success" className="mb-4">
            Thank you — the family will review it before it appears.
          </Alert>
        )}
        {signedIn ? (
          <MemoryForm
            memorialId={memorialId}
            slug={slug}
            name={name}
            onSubmitted={(id, values) => {
              setJustSubmitted(true);
              setMemories((prev) => [
                {
                  id,
                  memorial_id: memorialId,
                  author_id: viewerId!,
                  relationship: values.relationship || null,
                  body: values.body,
                  photo_path: values.photo_path,
                  status: "pending",
                  moderated_by: null,
                  moderated_at: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  author: { display_name: authorName ?? "You", avatar_path: null },
                },
                ...prev,
              ]);
              router.refresh();
            }}
          />
        ) : (
          <div className="card flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
            <div className="flex-1">
              <p className="font-display text-2xl text-ivory-50">Do you have a memory of {name}?</p>
              <p className="mt-1 text-sm text-ivory-400">Sign in to share a story or a photo with the family.</p>
            </div>
            <Link href={`/auth/sign-in?next=${encodeURIComponent(`/memorial/${slug}#memories`)}`} className="btn-primary shrink-0">
              Sign in to share
            </Link>
          </div>
        )}
      </div>

      <ReportModal open={reportId !== null} onClose={() => setReportId(null)} memoryId={reportId ?? undefined} signedIn={signedIn} subject="this memory" />
    </section>
  );
}
