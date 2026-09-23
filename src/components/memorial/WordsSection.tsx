import { Quote } from "lucide-react";
import type { MemorialWords } from "@/lib/appearance";
import { SectionHeading } from "./SectionHeading";

/** A saying, verse or quote in their own words, set large in the memorial's lettering. */
export function WordsSection({ words }: { words: MemorialWords | null }) {
  if (!words?.text) return null;
  return (
    <section id="words" aria-labelledby="words-heading" className="scroll-mt-32">
      <SectionHeading id="words-heading" eyebrow="In their words" title="Their Words" />
      <figure className="card relative overflow-hidden px-6 py-10 text-center sm:px-12 sm:py-14">
        <Quote aria-hidden size={56} className="absolute left-5 top-4 text-gold-400/15" />
        <blockquote className="mx-auto max-w-3xl font-display text-2xl italic leading-snug text-ivory-50 sm:text-4xl">&ldquo;{words.text}&rdquo;</blockquote>
        {words.attribution && <figcaption className="mt-5 text-xs font-medium uppercase tracking-[0.2em] text-gold-300">{words.attribution}</figcaption>}
      </figure>
    </section>
  );
}
