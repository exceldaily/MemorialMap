"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { addTimelineEvent, deleteTimelineEvent, updateTimelineEvent } from "@/lib/actions/memorial";
import { formatDate } from "@/lib/format";
import type { Memorial, TimelineEvent } from "@/lib/supabase/types";
import { planAllows, PlanNotice, Section } from "./shared";

type Draft = { year: string; event_date: string; title: string; description: string };
const emptyDraft: Draft = { year: "", event_date: "", title: "", description: "" };

function sortEvents(list: TimelineEvent[]) {
  return [...list].sort((a, b) => a.year - b.year || (a.event_date ?? "").localeCompare(b.event_date ?? "") || a.sort_order - b.sort_order);
}

export function TimelineTab({ memorial, events: initial, limits }: { memorial: Memorial; events: TimelineEvent[]; limits: Record<string, unknown> }) {
  const router = useRouter();
  const [events, setEvents] = useState(() => sortEvents(initial));
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const allowed = planAllows(limits, "timeline");

  function remove(ev: TimelineEvent) {
    if (!window.confirm(`Remove "${ev.title}" from the timeline?`)) return;
    setEvents((l) => l.filter((x) => x.id !== ev.id));
    startTransition(async () => {
      const res = await deleteTimelineEvent({ id: ev.id, slug: memorial.slug });
      if (!res.ok) {
        setError(res.error);
        setEvents((l) => sortEvents([...l, ev]));
      } else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {!allowed && <PlanNotice feature="Life timeline" />}
      <Section
        title="Life timeline"
        description="Milestones in the order they happened — where they were born, who they married, what they built."
        actions={
          editing !== "new" && (
            <button type="button" className="btn-primary" onClick={() => setEditing("new")} disabled={!allowed}>
              <Plus size={16} /> Add event
            </button>
          )
        }
      >
        {error && (
          <Alert kind="error" className="mb-4">
            {error}
          </Alert>
        )}
        {editing === "new" && (
          <EventForm
            memorialId={memorial.id}
            slug={memorial.slug}
            onCancel={() => setEditing(null)}
            onSaved={(ev) => {
              setEvents((l) => sortEvents([...l, ev]));
              setEditing(null);
              router.refresh();
            }}
          />
        )}

        {events.length === 0 && editing !== "new" ? (
          <EmptyState title="No events yet" body="Start with the year they were born, then add the moments that shaped their life." action={allowed ? <button type="button" className="btn-primary" onClick={() => setEditing("new")}><Plus size={16} /> Add first event</button> : undefined} />
        ) : (
          <ol className="relative mt-2 space-y-2 border-l border-gold-400/30 pl-6" aria-label="Timeline events">
            {events.map((ev) => (
              <li key={ev.id} className="relative">
                <span className="absolute -left-[1.85rem] top-4 h-3 w-3 rounded-full border-2 border-gold-400 bg-navy-900" aria-hidden />
                {editing === ev.id ? (
                  <EventForm
                    memorialId={memorial.id}
                    slug={memorial.slug}
                    event={ev}
                    onCancel={() => setEditing(null)}
                    onSaved={(saved) => {
                      setEvents((l) => sortEvents(l.map((x) => (x.id === saved.id ? saved : x))));
                      setEditing(null);
                      router.refresh();
                    }}
                  />
                ) : (
                  <div className="flex items-start gap-4 rounded-2xl border border-white/8 bg-navy-950/40 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-2xl text-gold-300">{ev.year}</p>
                      {ev.event_date && <p className="text-xs text-ivory-500">{formatDate(ev.event_date)}</p>}
                      <p className="mt-1 text-ivory-100">{ev.title}</p>
                      {ev.description && <p className="mt-1 whitespace-pre-line text-sm text-ivory-400">{ev.description}</p>}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button type="button" className="btn-ghost px-2.5 py-1.5" onClick={() => setEditing(ev.id)} aria-label={`Edit ${ev.title}`}>
                        <Pencil size={15} />
                      </button>
                      <button type="button" className="btn-ghost px-2.5 py-1.5 text-danger-400" onClick={() => remove(ev)} disabled={pending} aria-label={`Delete ${ev.title}`}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </Section>
    </div>
  );
}

function EventForm({ memorialId, slug, event, onCancel, onSaved }: { memorialId: string; slug: string; event?: TimelineEvent; onCancel: () => void; onSaved: (ev: TimelineEvent) => void }) {
  const [draft, setDraft] = useState<Draft>(event ? { year: String(event.year), event_date: event.event_date ?? "", title: event.title, description: event.description ?? "" } : emptyDraft);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const year = draft.event_date ? Number(draft.event_date.slice(0, 4)) : Number(draft.year);
    if (!year || !/^\d{4}$/.test(String(year))) {
      setError("Enter a four-digit year.");
      return;
    }
    if (!draft.title.trim()) {
      setError("Give the event a title.");
      return;
    }
    startTransition(async () => {
      const payload = { year, event_date: draft.event_date || null, title: draft.title.trim(), description: draft.description.trim() || null };
      const res = event ? await updateTimelineEvent({ id: event.id, slug, ...payload }) : await addTimelineEvent({ memorial_id: memorialId, slug, ...payload });
      if (!res.ok || !res.data) {
        setError(res.ok ? "Could not save the event." : res.error);
        return;
      }
      onSaved(res.data);
    });
  }

  return (
    <form onSubmit={submit} className="mb-4 space-y-3 rounded-2xl border border-gold-400/30 bg-navy-950/60 p-4" aria-label={event ? "Edit timeline event" : "New timeline event"}>
      <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
        <div>
          <label className="label" htmlFor="ev-year">
            Year <span className="text-gold-400">*</span>
          </label>
          <input id="ev-year" className="input" inputMode="numeric" placeholder="1948" value={draft.event_date ? draft.event_date.slice(0, 4) : draft.year} onChange={(e) => set("year", e.target.value.replace(/[^0-9]/g, "").slice(0, 4))} disabled={Boolean(draft.event_date)} required={!draft.event_date} />
        </div>
        <div>
          <label className="label" htmlFor="ev-date">
            Full date <span className="normal-case tracking-normal text-ivory-500">(optional)</span>
          </label>
          <input id="ev-date" type="date" className="input" value={draft.event_date} onChange={(e) => set("event_date", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="ev-title">
          Title <span className="text-gold-400">*</span>
        </label>
        <input id="ev-title" className="input" placeholder="e.g. Born in Miami, Florida" value={draft.title} onChange={(e) => set("title", e.target.value)} maxLength={150} required />
      </div>
      <div>
        <label className="label" htmlFor="ev-desc">
          Description <span className="normal-case tracking-normal text-ivory-500">(optional)</span>
        </label>
        <textarea id="ev-desc" className="input min-h-[5rem] resize-y" value={draft.description} onChange={(e) => set("description", e.target.value)} maxLength={2000} />
      </div>
      {error && <Alert kind="error">{error}</Alert>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={pending}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : event ? "Save event" : "Add event"}
        </button>
      </div>
    </form>
  );
}
