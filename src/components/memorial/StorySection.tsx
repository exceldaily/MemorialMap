import type { Memorial } from "@/lib/supabase/types";
import { SectionHeading } from "./SectionHeading";

const PROMPTS: { key: keyof Pick<Memorial, "known_for" | "loved" | "made_them_laugh" | "remember_them_for">; question: (name: string) => string }[] = [
  { key: "known_for", question: (n) => `What was ${n} known for?` },
  { key: "loved", question: (n) => `What did ${n} love?` },
  { key: "made_them_laugh", question: (n) => `What made ${n} laugh?` },
  { key: "remember_them_for", question: () => "What should we remember them for?" },
];

export function hasStory(m: Memorial) {
  return Boolean(m.biography || m.known_for || m.loved || m.made_them_laugh || m.remember_them_for);
}

export function StorySection({ memorial }: { memorial: Memorial }) {
  if (!hasStory(memorial)) return null;
  const firstName = memorial.nickname || memorial.first_name;
  const answers = PROMPTS.filter((p) => memorial[p.key]);

  return (
    <section id="story" aria-labelledby="story-heading" className="scroll-mt-32">
      <SectionHeading id="story-heading" eyebrow="Their life" title="Life Story" />
      {memorial.biography && (
        <div className="prose-memorial max-w-3xl first-letter:font-display first-letter:text-5xl first-letter:leading-[0.8] first-letter:text-gold-300 first-letter:float-left first-letter:mr-2 first-letter:mt-1">
          {memorial.biography}
        </div>
      )}
      {answers.length > 0 && (
        <dl className={memorial.biography ? "mt-10 grid gap-4 sm:grid-cols-2" : "grid gap-4 sm:grid-cols-2"}>
          {answers.map((p) => (
            <div key={p.key} className="card p-5 sm:p-6">
              <dt className="font-display text-lg italic text-gold-300">{p.question(firstName)}</dt>
              <dd className="mt-2 whitespace-pre-line leading-relaxed text-ivory-200">{memorial[p.key]}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
