"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageUploadField } from "@/components/create/ImageUploadField";
import { PersonFields } from "@/components/create/PersonFields";
import { PrivacyOptions } from "@/components/create/PrivacyOptions";
import { StoryFields } from "@/components/create/StoryFields";
import { memorialToPerson, memorialToStory, personToInput, storyToInput, validatePerson, validateStory, type FieldErrors } from "@/components/create/wizardTypes";
import { updateMemorial } from "@/lib/actions/memorial";
import type { Memorial, PrivacyLevel } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { planAllows, SaveBar, Section } from "./shared";

const ACCENTS = ["#d3b877", "#8aa88a", "#a9b8d6", "#d6a0a0", "#c9a0d6", "#e3cf9a", "#7fb3c9"];

export function DetailsTab({ memorial, isOwner, limits }: { memorial: Memorial; isOwner: boolean; limits: Record<string, unknown> }) {
  const router = useRouter();
  const [person, setPerson] = useState(() => memorialToPerson(memorial));
  const [story, setStory] = useState(() => memorialToStory(memorial));
  const [profile, setProfile] = useState<string | null>(memorial.profile_image_path);
  const [cover, setCover] = useState<string | null>(memorial.cover_image_path);
  const [accent, setAccent] = useState<string | null>(memorial.accent_color);
  const [privacy, setPrivacy] = useState<PrivacyLevel>(memorial.privacy);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const customAppearance = planAllows(limits, "custom_appearance");

  function save() {
    const e = { ...validatePerson(person), ...validateStory(story) };
    setErrors(e);
    setSaved(false);
    if (Object.keys(e).length) {
      setError("Please fix the highlighted fields.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await updateMemorial(memorial.id, memorial.slug, {
        ...personToInput(person),
        ...storyToInput(story),
        profile_image_path: profile,
        cover_image_path: cover,
        accent_color: customAppearance ? accent : undefined,
        privacy: isOwner && privacy !== memorial.privacy ? privacy : undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Section title="About them" description="Their name and dates. Changing the name does not change the memorial's web address.">
        <PersonFields value={person} onChange={setPerson} errors={errors} />
      </Section>

      <Section title="Photos" description="A portrait and a cover image. The full gallery lives in the Photos tab.">
        <div className="grid gap-8 md:grid-cols-[16rem_1fr]">
          <ImageUploadField label="Profile photo" bucket="memorial-profile-images" value={profile} onChange={setProfile} shape="square" altName={memorial.full_name} maxEdge={1200} />
          <ImageUploadField label="Cover image" bucket="memorial-cover-images" value={cover} onChange={setCover} shape="wide" altName={memorial.full_name} maxEdge={2400} />
        </div>
      </Section>

      <Section title="Their story" description="The epitaph, biography and the optional prompts.">
        <StoryFields value={story} onChange={setStory} errors={errors} firstName={person.first_name} />
      </Section>

      <Section title="Appearance" description={customAppearance ? "A subtle accent colour used for highlights on the memorial page." : "Custom accent colours are available on upgraded plans."}>
        <div className="flex flex-wrap items-center gap-3" role="radiogroup" aria-label="Accent colour">
          <button
            type="button"
            role="radio"
            aria-checked={accent === null}
            aria-label="Default accent"
            disabled={!customAppearance}
            onClick={() => setAccent(null)}
            className={cn("flex h-9 w-9 items-center justify-center rounded-full border text-[10px] uppercase tracking-wider", accent === null ? "border-gold-400 text-gold-300" : "border-white/15 text-ivory-500", !customAppearance && "opacity-50")}
          >
            auto
          </button>
          {ACCENTS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={accent === c}
              aria-label={`Accent colour ${c}`}
              disabled={!customAppearance}
              onClick={() => setAccent(c)}
              className={cn("h-9 w-9 rounded-full border-2 transition", accent === c ? "scale-110 border-ivory-50" : "border-transparent", !customAppearance && "opacity-50")}
              style={{ background: c }}
            />
          ))}
          <label className="ml-2 flex items-center gap-2 text-xs text-ivory-400">
            Custom
            <input type="color" value={accent ?? "#d3b877"} disabled={!customAppearance} onChange={(e) => setAccent(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-white/10 bg-transparent disabled:cursor-not-allowed" aria-label="Custom accent colour" />
          </label>
        </div>
      </Section>

      <Section title="Privacy" description={isOwner ? "Who can find and visit this memorial." : "Only the memorial owner can change who can see it."}>
        <PrivacyOptions value={privacy} onChange={setPrivacy} disabled={!isOwner} />
      </Section>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-white/8 bg-navy-900/95 px-4 pb-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-6">
        <SaveBar pending={pending} saved={saved} error={error} onSave={save} />
      </div>
    </div>
  );
}
