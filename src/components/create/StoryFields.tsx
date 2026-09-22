"use client";

import { useId } from "react";
import type { FieldErrors, StoryValues } from "./wizardTypes";
import { FieldError } from "./PersonFields";

const PROMPTS: { key: keyof StoryValues; label: string; placeholder: string }[] = [
  { key: "known_for", label: "What were they known for?", placeholder: "Their work, their kindness, their garden, their famous Sunday dinners…" },
  { key: "loved", label: "What did they love?", placeholder: "People, places, music, the sea, a good argument…" },
  { key: "made_them_laugh", label: "What made them laugh?", placeholder: "The small things that always got them." },
  { key: "remember_them_for", label: "What should people remember about them?", placeholder: "The one thing you hope never gets forgotten." },
];

export function StoryFields({ value, onChange, errors = {}, firstName }: { value: StoryValues; onChange: (v: StoryValues) => void; errors?: FieldErrors; firstName?: string }) {
  const id = useId();
  const set = <K extends keyof StoryValues>(k: K, v: StoryValues[K]) => onChange({ ...value, [k]: v });
  const name = firstName?.trim() || "them";

  return (
    <div className="space-y-6">
      <div>
        <label className="label" htmlFor={`${id}-epitaph`}>
          Epitaph
        </label>
        <input
          id={`${id}-epitaph`}
          className="input font-display text-lg"
          maxLength={200}
          value={value.epitaph}
          onChange={(e) => set("epitaph", e.target.value)}
          aria-invalid={Boolean(errors.epitaph)}
          aria-describedby={`${id}-epitaph-hint`}
        />
        <p id={`${id}-epitaph-hint`} className="mt-1.5 text-xs text-ivory-500">
          A short line shown beneath their name. {value.epitaph.length}/200
        </p>
        <FieldError id={`${id}-epitaph-err`} message={errors.epitaph} />
      </div>

      <div>
        <label className="label" htmlFor={`${id}-bio`}>
          Biography
        </label>
        <textarea
          id={`${id}-bio`}
          className="input min-h-[12rem] resize-y leading-relaxed"
          placeholder={`Tell the story of ${name}'s life in your own words. Where they grew up, who they loved, what they built, how they made people feel.`}
          value={value.biography}
          onChange={(e) => set("biography", e.target.value)}
        />
      </div>

      <div className="rounded-2xl border border-white/8 bg-navy-950/40 p-4 sm:p-5">
        <p className="eyebrow">Optional prompts</p>
        <p className="mt-1 text-sm text-ivory-400">Answer any that feel right. Each becomes its own small passage on the memorial.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {PROMPTS.map((p) => (
            <div key={p.key}>
              <label className="label normal-case tracking-normal text-ivory-200" htmlFor={`${id}-${p.key}`}>
                {p.label}
              </label>
              <textarea id={`${id}-${p.key}`} className="input min-h-[6rem] resize-y" placeholder={p.placeholder} value={value[p.key]} onChange={(e) => set(p.key, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="label" htmlFor={`${id}-resting`}>
          Actual resting place <span className="normal-case tracking-normal text-ivory-500">(optional)</span>
        </label>
        <input id={`${id}-resting`} className="input" placeholder="e.g. Rose Hill Cemetery, Section B — or 'ashes scattered at sea'" value={value.resting_place} onChange={(e) => set("resting_place", e.target.value)} aria-describedby={`${id}-resting-hint`} />
        <p id={`${id}-resting-hint`} className="mt-1.5 text-xs leading-relaxed text-ivory-500">
          Written text only. This is completely separate from the digital memorial location you choose on the map, which is a virtual marker within our platform.
        </p>
      </div>
    </div>
  );
}
