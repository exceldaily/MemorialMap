"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Save, Sparkles } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { LocationPicker } from "@/components/map/LocationPicker";
import { claimLocation, createMemorialDraft, publishMemorial, updateMemorial } from "@/lib/actions/memorial";
import { LOCATION_DISCLAIMER_SHORT } from "@/lib/site";
import { cn } from "@/lib/utils";
import { FamilyGroupSelect } from "./FamilyGroupSelect";
import { ImageUploadField } from "./ImageUploadField";
import { MemorialPreview } from "./MemorialPreview";
import { PersonFields } from "./PersonFields";
import { PrivacyOptions } from "./PrivacyOptions";
import { StoryFields } from "./StoryFields";
import {
  displayName,
  initialWizardState,
  validatePerson,
  validateStory,
  WIZARD_STEPS,
  wizardToInput,
  yearOf,
  type FieldErrors,
  type WizardState,
} from "./wizardTypes";

const STORAGE_KEY = "mm_create_wizard_v1";

function loadState(): WizardState {
  if (typeof window === "undefined") return initialWizardState;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return initialWizardState;
    const parsed = JSON.parse(raw) as Partial<WizardState>;
    return {
      ...initialWizardState,
      ...parsed,
      person: { ...initialWizardState.person, ...(parsed.person ?? {}) },
      story: { ...initialWizardState.story, ...(parsed.story ?? {}) },
      step: Math.min(Math.max(parsed.step ?? 0, 0), WIZARD_STEPS.length - 1),
    };
  } catch {
    return initialWizardState;
  }
}

export function CreateMemorialWizard({ userDisplayName }: { userDisplayName?: string | null }) {
  const router = useRouter();
  const [state, setState] = useState<WizardState>(initialWizardState);
  const [hydrated, setHydrated] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"publish" | "draft" | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Restore from sessionStorage after mount (avoids hydration mismatches).
  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
  }, [state, hydrated]);

  const step = state.step;
  const patch = useCallback((p: Partial<WizardState>) => setState((s) => ({ ...s, ...p })), []);

  const goTo = useCallback((next: number) => {
    setErrors({});
    setFormError(null);
    setState((s) => ({ ...s, step: next }));
    requestAnimationFrame(() => {
      headingRef.current?.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, []);

  function validateStep(i: number): FieldErrors {
    if (i === 0) return validatePerson(state.person);
    if (i === 2) return validateStory(state.story);
    if (i === 3 && !state.location) return { location: "Choose a memorial location on the map to continue." };
    return {};
  }

  function next() {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length) {
      setFormError("Please fix the highlighted fields.");
      return;
    }
    goTo(Math.min(step + 1, WIZARD_STEPS.length - 1));
  }

  function canJumpTo(i: number) {
    if (i <= step) return true;
    for (let k = 0; k < i; k++) if (Object.keys(validateStep(k)).length) return false;
    return true;
  }

  /** Creates or updates the draft row and returns its id + slug. */
  async function ensureDraft(): Promise<{ id: string; slug: string } | null> {
    const input = wizardToInput(state);
    if (state.memorialId && state.slug) {
      const res = await updateMemorial(state.memorialId, state.slug, input);
      if (!res.ok) {
        setFormError(res.error);
        return null;
      }
      return { id: state.memorialId, slug: res.data?.slug ?? state.slug };
    }
    const res = await createMemorialDraft(input);
    if (!res.ok || !res.data) {
      setFormError(res.ok ? "Could not create the memorial." : res.error);
      return null;
    }
    patch({ memorialId: res.data.id, slug: res.data.slug });
    return { id: res.data.id, slug: res.data.slug };
  }

  async function claim(id: string): Promise<boolean> {
    if (!state.location) return true;
    const res = await claimLocation(id, state.location.lat, state.location.lng, state.location.placeName);
    if (!res.ok) {
      setFormError(res.error);
      return false;
    }
    if (!res.data?.available) {
      setState((s) => ({ ...s, step: 3, location: null }));
      setErrors({ location: res.data?.message ?? "That location is no longer available. Please choose another." });
      setFormError(res.data?.message ?? "That location is no longer available. Please choose another.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return false;
    }
    return true;
  }

  async function submit(mode: "publish" | "draft") {
    const all: FieldErrors = { ...validatePerson(state.person), ...validateStory(state.story) };
    if (mode === "publish" && !state.location) all.location = "Choose a memorial location before publishing.";
    if (Object.keys(all).length) {
      setErrors(all);
      const firstStep = all.first_name || all.last_name || all.birth_date || all.birth_year || all.death_date || all.death_year ? 0 : all.epitaph ? 2 : 3;
      setState((s) => ({ ...s, step: firstStep }));
      setFormError("A few details need attention before we continue.");
      return;
    }
    setBusy(mode);
    setFormError(null);
    try {
      const draft = await ensureDraft();
      if (!draft) return;
      const claimed = await claim(draft.id);
      if (!claimed) return;
      if (mode === "draft") {
        clearStorage();
        router.push("/dashboard");
        return;
      }
      const pub = await publishMemorial(draft.id);
      if (!pub.ok) {
        setFormError(pub.error);
        return;
      }
      clearStorage();
      router.push(`/memorial/${pub.data?.slug ?? draft.slug}`);
    } finally {
      setBusy(null);
    }
  }

  function clearStorage() {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  const name = displayName(state.person);
  const firstName = state.person.first_name;
  const progress = useMemo(() => Math.round(((step + 1) / WIZARD_STEPS.length) * 100), [step]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      {/* Stepper */}
      <nav aria-label="Memorial creation steps" className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-3 flex items-center justify-between text-xs text-ivory-400 lg:hidden">
          <span>
            Step {step + 1} of {WIZARD_STEPS.length}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10 lg:hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progress">
          <div className="h-full rounded-full bg-gold-400 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <ol className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible">
          {WIZARD_STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            const reachable = canJumpTo(i);
            return (
              <li key={s.key} className="shrink-0">
                <button
                  type="button"
                  onClick={() => reachable && goTo(i)}
                  disabled={!reachable}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-full px-3 py-2 text-left text-sm transition lg:rounded-xl",
                    active ? "bg-gold-400/15 text-ivory-50" : done ? "text-ivory-200 hover:bg-white/5" : "text-ivory-500",
                    !reachable && "cursor-not-allowed",
                  )}
                >
                  <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px]", active ? "border-gold-400 bg-gold-400 text-navy-950" : done ? "border-gold-400/60 text-gold-300" : "border-white/15")} aria-hidden>
                    {done ? <Check size={12} /> : i + 1}
                  </span>
                  <span className="whitespace-nowrap">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step content */}
      <section className="min-w-0">
        <p className="eyebrow">
          Step {step + 1} of {WIZARD_STEPS.length}
        </p>
        <h1 ref={headingRef} tabIndex={-1} className="mt-1 text-3xl text-ivory-50 outline-none sm:text-4xl">
          {WIZARD_STEPS[step].title}
        </h1>

        <div className="card mt-6 p-5 sm:p-8 animate-fade-up" key={step}>
          {formError && (
            <Alert kind="error" className="mb-6">
              {formError}
            </Alert>
          )}

          {step === 0 && (
            <>
              <p className="mb-6 text-sm text-ivory-400">
                {userDisplayName ? `Thank you, ${userDisplayName}. ` : ""}Start with their name and dates. Everything can be changed later.
              </p>
              <PersonFields value={state.person} onChange={(person) => patch({ person })} errors={errors} />
            </>
          )}

          {step === 1 && (
            <div className="space-y-8">
              <p className="text-sm text-ivory-400">Photos are optional but make a memorial feel like home. You can add a whole gallery after publishing.</p>
              <ImageUploadField label="Profile photo" hint="Shown as a circular portrait at the top of the memorial." bucket="memorial-profile-images" value={state.profile_image_path} onChange={(p) => patch({ profile_image_path: p })} shape="square" altName={name} maxEdge={1200} />
              <ImageUploadField label="Cover image" hint="A wide landscape image behind their name — a favourite place, a view, a texture." bucket="memorial-cover-images" value={state.cover_image_path} onChange={(p) => patch({ cover_image_path: p })} shape="wide" altName={name} maxEdge={2400} />
            </div>
          )}

          {step === 2 && <StoryFields value={state.story} onChange={(story) => patch({ story })} errors={errors} firstName={firstName} />}

          {step === 3 && (
            <div className="space-y-5">
              <p className="text-sm leading-relaxed text-ivory-400">
                Choose a place that meant something to {firstName || "them"}: a hometown, a beach, a mountain, a favourite street. Search or tap anywhere on the map, then confirm the spot.
              </p>
              <Alert kind="info">{LOCATION_DISCLAIMER_SHORT}</Alert>
              {errors.location && <Alert kind="warning">{errors.location}</Alert>}
              <FamilyGroupSelect value={state.family_group_id} onChange={(id) => patch({ family_group_id: id })} />
              <LocationPicker value={state.location} onChange={(loc) => patch({ location: loc })} familyGroupId={state.family_group_id} className="h-[60vh] min-h-[420px]" />
              {state.location && (
                <Alert kind="success">
                  Memorial location chosen{state.location.placeName ? ` near ${state.location.placeName}` : ""}. It will be reserved when you publish or save.
                </Alert>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <p className="text-sm text-ivory-400">You can change this at any time from the memorial settings.</p>
              <PrivacyOptions value={state.privacy} onChange={(privacy) => patch({ privacy })} />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <p className="text-sm text-ivory-400">This is how {name || "the memorial"} will appear to visitors. Use the steps on the side to make changes.</p>
              <MemorialPreview
                name={name}
                nickname={state.person.nickname}
                birthYear={yearOf(state.person.birth_mode, state.person.birth_date, state.person.birth_year)}
                deathYear={state.person.memorial_type === "living" ? null : yearOf(state.person.death_mode, state.person.death_date, state.person.death_year)}
                memorialType={state.person.memorial_type}
                epitaph={state.story.epitaph.trim() || "Forever remembered."}
                biography={state.story.biography}
                profilePath={state.profile_image_path}
                coverPath={state.cover_image_path}
                location={state.location}
                privacy={state.privacy}
                restingPlace={state.story.resting_place}
              />
              {!state.location && <Alert kind="warning">A memorial location is required to publish. You can still save this as a draft.</Alert>}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {step > 0 && (
              <button type="button" className="btn-ghost" onClick={() => goTo(step - 1)} disabled={busy !== null}>
                <ArrowLeft size={16} /> Back
              </button>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {step >= 3 && (
              <button type="button" className="btn-secondary" onClick={() => submit("draft")} disabled={busy !== null}>
                {busy === "draft" ? <Spinner className="h-4 w-4" /> : <Save size={16} />} Save as draft
              </button>
            )}
            {step < WIZARD_STEPS.length - 1 ? (
              <button type="button" className="btn-primary" onClick={next} disabled={busy !== null}>
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={() => submit("publish")} disabled={busy !== null || !state.location}>
                {busy === "publish" ? <Spinner className="h-4 w-4 border-navy-900/40 border-t-navy-900" /> : <Sparkles size={16} />} Publish Memorial
              </button>
            )}
          </div>
        </div>
        {state.memorialId && <p className="mt-3 text-xs text-ivory-500">A draft of this memorial has been created. Publishing will update it rather than create a duplicate.</p>}
      </section>
    </div>
  );
}
