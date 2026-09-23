import type { CSSProperties } from "react";
import type { Json } from "@/lib/supabase/types";

/**
 * Per-memorial appearance. Everything here is data: a theme re-tints the
 * design tokens on the memorial page wrapper, so components pick it up
 * without knowing about themes at all. Nothing is free-form HTML or CSS.
 */

export const THEME_KEYS = ["night", "starlight", "chapel", "ocean", "sunset", "parchment", "garden"] as const;
export type ThemeKey = (typeof THEME_KEYS)[number];

export const FONT_KEYS = ["classic", "script", "modern"] as const;
export type FontKey = (typeof FONT_KEYS)[number];

export const HERO_KEYS = ["centered", "cover", "split"] as const;
export type HeroLayout = (typeof HERO_KEYS)[number];

export const SECTION_KEYS = ["location", "story", "photos", "videos", "memories", "timeline", "family", "tributes"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export type MemorialBackground = { image_path: string | null; blur: number; dim: number };

export type MemorialAppearance = {
  theme: ThemeKey;
  font: FontKey;
  hero: HeroLayout;
  /** Background photo behind the whole page. Upgraded plans only. */
  background: MemorialBackground | null;
  sections: { order: SectionKey[]; hidden: SectionKey[] };
};

export const THEMES: Record<ThemeKey, { label: string; description: string; light: boolean; swatch: { bg: string; surface: string; text: string; accent: string } }> = {
  night: { label: "Night Sky", description: "Deep navy, warm ivory and muted gold. The Everwhere default.", light: false, swatch: { bg: "#0b1220", surface: "#111a2c", text: "#f4efe4", accent: "#d3b877" } },
  starlight: { label: "Starlight", description: "Midnight indigo with silver highlights.", light: false, swatch: { bg: "#0a0d1f", surface: "#121633", text: "#f4efe4", accent: "#c9ceda" } },
  chapel: { label: "Chapel", description: "Quiet charcoal and candlelight gold.", light: false, swatch: { bg: "#141416", surface: "#1d1d21", text: "#f4efe4", accent: "#e4c983" } },
  ocean: { label: "Ocean", description: "Deep teal water with sea-glass accents.", light: false, swatch: { bg: "#071e26", surface: "#0d2a34", text: "#e6f0ee", accent: "#8fd0c1" } },
  sunset: { label: "Sunset", description: "Warm plum dusk with amber light.", light: false, swatch: { bg: "#1f0f18", surface: "#2b1622", text: "#f8e9dd", accent: "#eaa85f" } },
  parchment: { label: "Parchment", description: "Soft cream paper, dark ink and antique gold.", light: true, swatch: { bg: "#f3ebd9", surface: "#faf4e6", text: "#241e14", accent: "#8e6a26" } },
  garden: { label: "Garden", description: "Gentle greens and morning light.", light: true, swatch: { bg: "#e7efe3", surface: "#f2f7ef", text: "#1c261c", accent: "#7d6a25" } },
};

export const FONTS: Record<FontKey, { label: string; description: string; family: string }> = {
  classic: { label: "Classic", description: "An elegant serif. Timeless and calm.", family: '"Cormorant Garamond", Georgia, serif' },
  script: { label: "Handwritten", description: "A flowing script for a personal touch.", family: '"Dancing Script", "Cormorant Garamond", cursive' },
  modern: { label: "Modern", description: "Clean and understated.", family: '"Montserrat", "Inter", sans-serif' },
};

export const HERO_LAYOUTS: Record<HeroLayout, { label: string; description: string }> = {
  centered: { label: "Portrait", description: "A round portrait centred beneath the cover image." },
  cover: { label: "Full cover", description: "A tall cover photo with the name across the bottom." },
  split: { label: "Side by side", description: "A large portrait beside the name and epitaph." },
};

export const SECTION_LABELS: Record<SectionKey, string> = {
  location: "Location",
  story: "Life Story",
  photos: "Photos",
  videos: "Videos",
  memories: "Memories",
  timeline: "Timeline",
  family: "Family",
  tributes: "Tributes",
};

export const DEFAULT_APPEARANCE: MemorialAppearance = {
  theme: "night",
  font: "classic",
  hero: "centered",
  background: null,
  sections: { order: [...SECTION_KEYS], hidden: [] },
};

export const BACKGROUND_DEFAULTS = { blur: 6, dim: 55 };

function isKey<T extends readonly string[]>(keys: T, v: unknown): v is T[number] {
  return typeof v === "string" && (keys as readonly string[]).includes(v);
}

function clamp(v: unknown, min: number, max: number, fallback: number) {
  return typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
}

function record(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

/** Normalises whatever is stored in `memorials.appearance` into a complete, valid object. */
export function readAppearance(raw: Json | null | undefined): MemorialAppearance {
  const r = record(raw);
  const theme = isKey(THEME_KEYS, r.theme) ? r.theme : DEFAULT_APPEARANCE.theme;
  const font = isKey(FONT_KEYS, r.font) ? r.font : DEFAULT_APPEARANCE.font;
  const hero = isKey(HERO_KEYS, r.hero) ? r.hero : DEFAULT_APPEARANCE.hero;

  let background: MemorialBackground | null = null;
  const b = record(r.background);
  if (typeof b.image_path === "string" && b.image_path) {
    background = { image_path: b.image_path, blur: clamp(b.blur, 0, 24, BACKGROUND_DEFAULTS.blur), dim: clamp(b.dim, 0, 90, BACKGROUND_DEFAULTS.dim) };
  }

  const s = record(r.sections);
  const rawOrder = Array.isArray(s.order) ? s.order.filter((k): k is SectionKey => isKey(SECTION_KEYS, k)) : [];
  const order = [...new Set<SectionKey>([...rawOrder, ...SECTION_KEYS])];
  const hidden = Array.isArray(s.hidden) ? [...new Set(s.hidden.filter((k): k is SectionKey => isKey(SECTION_KEYS, k)))] : [];

  return { theme, font, hero, background, sections: { order, hidden } };
}

/** Re-tints the gold scale from a single accent colour via CSS variables on the page wrapper. */
export function accentVars(accent: string | null | undefined): CSSProperties {
  if (!accent || !/^#[0-9a-fA-F]{6}$/.test(accent)) return {};
  return {
    "--color-gold-300": `color-mix(in oklab, ${accent} 72%, white)`,
    "--color-gold-400": accent,
    "--color-gold-500": `color-mix(in oklab, ${accent} 82%, black)`,
    "--color-gold-600": `color-mix(in oklab, ${accent} 64%, black)`,
    "--color-gold-700": `color-mix(in oklab, ${accent} 48%, black)`,
  } as CSSProperties;
}

/** Inline style for the blurred, dimmed background photo layer. */
export function backgroundLayerStyle(b: MemorialBackground, url: string): CSSProperties {
  const top = `color-mix(in oklab, var(--color-navy-900) ${b.dim}%, transparent)`;
  const bottom = `color-mix(in oklab, var(--color-navy-900) ${Math.min(100, b.dim + 25)}%, transparent)`;
  return {
    backgroundImage: `linear-gradient(${top}, ${bottom}), url("${url}")`,
    filter: b.blur ? `blur(${b.blur}px)` : undefined,
  };
}
