export type SectionLink = { id: string; label: string };

/**
 * Sticky, horizontally scrollable in-page navigation. Sits directly under the
 * fixed site header. Plain anchors so it works without JavaScript.
 */
export function SectionNav({ sections }: { sections: SectionLink[] }) {
  if (sections.length < 2) return null;
  return (
    <nav aria-label="Memorial sections" className="sticky top-16 z-20 border-b border-white/5 bg-navy-900/85 backdrop-blur-md">
      <div className="container-page">
        <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          {sections.map((s) => (
            <li key={s.id} className="shrink-0">
              <a
                href={`#${s.id}`}
                className="inline-block rounded-full px-3.5 py-1.5 text-sm text-ivory-300 transition hover:bg-white/8 hover:text-ivory-50 focus-visible:bg-white/8"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
