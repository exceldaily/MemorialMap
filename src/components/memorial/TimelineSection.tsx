import { formatDate } from "@/lib/format";
import type { TimelineEvent } from "@/lib/supabase/types";
import { SectionHeading } from "./SectionHeading";

export function TimelineSection({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) return null;
  return (
    <section id="timeline" aria-labelledby="timeline-heading" className="scroll-mt-32">
      <SectionHeading id="timeline-heading" eyebrow="Through the years" title="Timeline" />
      <ol className="relative ml-3 border-l border-gold-400/30 pl-8 sm:ml-6 sm:pl-12">
        {events.map((e) => (
          <li key={e.id} className="relative pb-10 last:pb-0">
            <span aria-hidden className="absolute -left-[calc(2rem+5px)] top-2 h-2.5 w-2.5 rounded-full bg-gold-400 ring-4 ring-navy-900 sm:-left-[calc(3rem+5px)]" />
            <p className="font-display text-3xl leading-none text-gold-300">{e.year}</p>
            <h3 className="mt-2 text-xl text-ivory-50">{e.title}</h3>
            {e.event_date && (
              <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-ivory-500">
                <time dateTime={e.event_date}>{formatDate(e.event_date)}</time>
              </p>
            )}
            {e.description && <p className="mt-2 max-w-2xl whitespace-pre-line leading-relaxed text-ivory-300">{e.description}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
