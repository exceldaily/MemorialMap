"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageUploadField } from "@/components/create/ImageUploadField";
import { PersonFields } from "@/components/create/PersonFields";
import { PrivacyOptions } from "@/components/create/PrivacyOptions";
import { StoryFields } from "@/components/create/StoryFields";
import { memorialToPerson, memorialToStory, personToInput, storyToInput, validatePerson, validateStory, type FieldErrors } from "@/components/create/wizardTypes";
import { updateMemorial } from "@/lib/actions/memorial";
import type { Memorial, PrivacyLevel } from "@/lib/supabase/types";
import { SaveBar, Section } from "./shared";

export function DetailsTab({ memorial, isOwner }: { memorial: Memorial; isOwner: boolean; limits: Record<string, unknown> }) {
  const router = useRouter();
  const [person, setPerson] = useState(() => memorialToPerson(memorial));
  const [story, setStory] = useState(() => memorialToStory(memorial));
  const [profile, setProfile] = useState<string | null>(memorial.profile_image_path);
  const [cover, setCover] = useState<string | null>(memorial.cover_image_path);
  const [privacy, setPrivacy] = useState<PrivacyLevel>(memorial.privacy);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

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

      <Section
        title="Appearance"
        description="Themes, colours, lettering and layout now live in their own tab."
        actions={
          <Link href={`/memorial/${memorial.slug}/edit?tab=appearance`} className="btn-secondary">
            Open Appearance
          </Link>
        }
      >
        <p className="text-sm text-ivory-400">Give the page its own feel: choose a theme, an accent colour, the lettering, the header layout and the order of the sections.</p>
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
