import type { ChosenLocation } from "@/components/map/LocationPicker";
import type { CreateMemorialInput, Memorial, MemorialType, PrivacyLevel } from "@/lib/supabase/types";

export type DateMode = "date" | "year" | "unknown";

export type PersonValues = {
  memorial_type: MemorialType;
  first_name: string;
  middle_name: string;
  last_name: string;
  nickname: string;
  birth_mode: DateMode;
  birth_date: string;
  birth_year: string;
  death_mode: DateMode;
  death_date: string;
  death_year: string;
};

export type StoryValues = {
  epitaph: string;
  biography: string;
  known_for: string;
  loved: string;
  made_them_laugh: string;
  remember_them_for: string;
  resting_place: string;
};

export type WizardState = {
  step: number;
  memorialId: string | null;
  slug: string | null;
  person: PersonValues;
  story: StoryValues;
  profile_image_path: string | null;
  cover_image_path: string | null;
  location: ChosenLocation | null;
  family_group_id: string | null;
  privacy: PrivacyLevel;
};

export const DEFAULT_EPITAPH = "Forever remembered.";

export const emptyPerson: PersonValues = {
  memorial_type: "deceased",
  first_name: "",
  middle_name: "",
  last_name: "",
  nickname: "",
  birth_mode: "date",
  birth_date: "",
  birth_year: "",
  death_mode: "date",
  death_date: "",
  death_year: "",
};

export const emptyStory: StoryValues = {
  epitaph: DEFAULT_EPITAPH,
  biography: "",
  known_for: "",
  loved: "",
  made_them_laugh: "",
  remember_them_for: "",
  resting_place: "",
};

export const initialWizardState: WizardState = {
  step: 0,
  memorialId: null,
  slug: null,
  person: emptyPerson,
  story: emptyStory,
  profile_image_path: null,
  cover_image_path: null,
  location: null,
  family_group_id: null,
  privacy: "public",
};

export const WIZARD_STEPS = [
  { key: "person", label: "Person", title: "Who are we remembering?" },
  { key: "photos", label: "Photos", title: "A face to remember" },
  { key: "story", label: "Their story", title: "Tell their story" },
  { key: "location", label: "Location", title: "Choose a memorial location" },
  { key: "privacy", label: "Privacy", title: "Who can visit?" },
  { key: "review", label: "Review", title: "Review and publish" },
] as const;

const YEAR_RE = /^\d{4}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type FieldErrors = Record<string, string>;

export function yearOf(mode: DateMode, date: string, year: string): number | null {
  if (mode === "unknown") return null;
  if (mode === "date") return DATE_RE.test(date) ? Number(date.slice(0, 4)) : null;
  return YEAR_RE.test(year) ? Number(year) : null;
}

export function validatePerson(p: PersonValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!p.first_name.trim()) errors.first_name = "Please enter their first name.";
  if (!p.last_name.trim()) errors.last_name = "Please enter their last name.";
  const currentYear = new Date().getFullYear();
  if (p.birth_mode === "date") {
    if (!p.birth_date) errors.birth_date = "Enter a date of birth, or mark it as unknown.";
    else if (!DATE_RE.test(p.birth_date) || Number.isNaN(new Date(p.birth_date).getTime())) errors.birth_date = "That date doesn't look right.";
  } else if (p.birth_mode === "year") {
    if (!YEAR_RE.test(p.birth_year)) errors.birth_year = "Enter a four-digit year.";
    else if (Number(p.birth_year) > currentYear) errors.birth_year = "The year of birth cannot be in the future.";
  }
  if (p.memorial_type === "deceased") {
    if (p.death_mode === "date") {
      if (!p.death_date) errors.death_date = "Enter the date of passing, or mark it as unknown.";
      else if (!DATE_RE.test(p.death_date) || Number.isNaN(new Date(p.death_date).getTime())) errors.death_date = "That date doesn't look right.";
    } else if (p.death_mode === "year") {
      if (!YEAR_RE.test(p.death_year)) errors.death_year = "Enter a four-digit year.";
      else if (Number(p.death_year) > currentYear) errors.death_year = "The year of passing cannot be in the future.";
    }
    const by = yearOf(p.birth_mode, p.birth_date, p.birth_year);
    const dy = yearOf(p.death_mode, p.death_date, p.death_year);
    if (by && dy && dy < by && !errors.death_date && !errors.death_year) {
      errors[p.death_mode === "date" ? "death_date" : "death_year"] = "The date of passing cannot be before the date of birth.";
    }
    if (p.birth_mode === "date" && p.death_mode === "date" && p.birth_date && p.death_date && p.death_date < p.birth_date && !errors.death_date) {
      errors.death_date = "The date of passing cannot be before the date of birth.";
    }
  }
  return errors;
}

export function validateStory(s: StoryValues): FieldErrors {
  const errors: FieldErrors = {};
  if (s.epitaph.trim().length > 200) errors.epitaph = "Epitaphs are limited to 200 characters.";
  return errors;
}

/** Converts wizard values into the payload accepted by `create_memorial` / `updateMemorial`. */
export function personToInput(p: PersonValues): Pick<CreateMemorialInput, "memorial_type" | "first_name" | "middle_name" | "last_name" | "nickname" | "birth_date" | "birth_year" | "birth_unknown" | "death_date" | "death_year" | "death_unknown"> {
  const living = p.memorial_type === "living";
  return {
    memorial_type: p.memorial_type,
    first_name: p.first_name.trim(),
    middle_name: p.middle_name.trim() || null,
    last_name: p.last_name.trim(),
    nickname: p.nickname.trim() || null,
    birth_date: p.birth_mode === "date" ? p.birth_date || null : null,
    birth_year: yearOf(p.birth_mode, p.birth_date, p.birth_year),
    birth_unknown: p.birth_mode === "unknown",
    death_date: !living && p.death_mode === "date" ? p.death_date || null : null,
    death_year: living ? null : yearOf(p.death_mode, p.death_date, p.death_year),
    death_unknown: living ? false : p.death_mode === "unknown",
  };
}

export function storyToInput(s: StoryValues): Pick<CreateMemorialInput, "epitaph" | "biography" | "known_for" | "loved" | "made_them_laugh" | "remember_them_for" | "resting_place"> {
  return {
    epitaph: s.epitaph.trim() || DEFAULT_EPITAPH,
    biography: s.biography.trim() || null,
    known_for: s.known_for.trim() || null,
    loved: s.loved.trim() || null,
    made_them_laugh: s.made_them_laugh.trim() || null,
    remember_them_for: s.remember_them_for.trim() || null,
    resting_place: s.resting_place.trim() || null,
  };
}

export function wizardToInput(state: WizardState): CreateMemorialInput {
  return {
    ...personToInput(state.person),
    ...storyToInput(state.story),
    profile_image_path: state.profile_image_path,
    cover_image_path: state.cover_image_path,
    privacy: state.privacy,
    family_group_id: state.family_group_id,
  };
}

/** Reverse mapping used by the edit screens. */
export function memorialToPerson(m: Memorial): PersonValues {
  return {
    memorial_type: m.memorial_type,
    first_name: m.first_name,
    middle_name: m.middle_name ?? "",
    last_name: m.last_name,
    nickname: m.nickname ?? "",
    birth_mode: m.birth_unknown ? "unknown" : m.birth_date ? "date" : m.birth_year ? "year" : "date",
    birth_date: m.birth_date ?? "",
    birth_year: m.birth_year ? String(m.birth_year) : "",
    death_mode: m.death_unknown ? "unknown" : m.death_date ? "date" : m.death_year ? "year" : "date",
    death_date: m.death_date ?? "",
    death_year: m.death_year ? String(m.death_year) : "",
  };
}

export function memorialToStory(m: Memorial): StoryValues {
  return {
    epitaph: m.epitaph ?? DEFAULT_EPITAPH,
    biography: m.biography ?? "",
    known_for: m.known_for ?? "",
    loved: m.loved ?? "",
    made_them_laugh: m.made_them_laugh ?? "",
    remember_them_for: m.remember_them_for ?? "",
    resting_place: m.resting_place ?? "",
  };
}

export function displayName(p: Pick<PersonValues, "first_name" | "middle_name" | "last_name">) {
  return [p.first_name, p.middle_name, p.last_name].map((s) => s.trim()).filter(Boolean).join(" ");
}
