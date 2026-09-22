import type { ReactNode } from "react";

/** Consistent heading for each memorial page section. */
export function SectionHeading({ id, eyebrow, title, aside }: { id?: string; eyebrow?: string; title: string; aside?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h2 id={id} className="text-3xl text-ivory-50 sm:text-4xl">
          {title}
        </h2>
      </div>
      {aside && <div className="text-sm text-ivory-400">{aside}</div>}
    </div>
  );
}
