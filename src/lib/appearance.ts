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

export const FRAME_KEYS = ["none", "gilded", "halo", "vintage", "laurel", "petals"] as const;
export type FrameKey = (typeof FRAME_KEYS)[number];

/** Decorative motifs, used both as hero stickers and as icons on favourite-thing tiles. Icons live in components/memorial/motifs.ts. */
export const MOTIF_KEYS = [
  "flowers", "dove", "stars", "candle", "leaves", "music", "heart", "waves", "sun", "moon", "butterfly", "anchor",
  "paw", "trophy", "guitar", "plane", "fish", "pine", "mountain", "camera", "book", "coffee", "car", "cross",
  "rainbow", "cake", "rocket", "feather", "wine", "home", "film", "gamepad", "sprout", "bike", "sailboat", "piano",
] as const;
export type MotifKey = (typeof MOTIF_KEYS)[number];

export const SECTION_KEYS = ["location", "story", "words", "photos", "videos", "favourites", "memories", "timeline", "family", "tributes"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export const MAX_STICKERS = 6;
export const MAX_FAVOURITES = 8;

export type MemorialBackground = { image_path: string | null; blur: number; dim: number };
export type MemorialSong = { storage_path: string | null; external_url: string | null; title: string | null };
export type MemorialWords = { text: string; attribution: string | null };
export type MemorialFavourite = { icon: MotifKey; label: string; value: string };

export type MemorialAppearance = {
  theme: ThemeKey;
  font: FontKey;
  hero: HeroLayout;
  /** Background photo behind the whole page. Upgraded plans only. */
  background: MemorialBackground | null;
  /** Decorative frame around the portrait. Upgraded plans only. */
  frame: FrameKey;
  /** Motifs floating around the header. Upgraded plans only. */
  stickers: MotifKey[];
  /** Their song: an uploaded track and/or a link to a streaming service. Upgraded plans only. Never autoplays. */
  song: MemorialSong | null;
  /** A favourite saying, verse or quote in their own words. */
  words: MemorialWords | null;
  /** Favourite things, shown as tiles. */
  favourites: MemorialFavourite[];
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

export const FRAMES: Record<FrameKey, { label: string; description: string }> = {
  none: { label: "None", description: "A simple ring in the accent colour." },
  gilded: { label: "Gilded", description: "A double gold border with four small ornaments." },
  halo: { label: "Halo", description: "A soft glow of light around the portrait." },
  vintage: { label: "Locket", description: "A cream mat and dark edge, like an old locket." },
  laurel: { label: "Laurel", description: "Two branches of leaves either side." },
  petals: { label: "Petals", description: "A wreath of petals all the way round." },
};

export const MOTIF_LABELS: Record<MotifKey, string> = {
  flowers: "Flowers", dove: "Dove", stars: "Stars", candle: "Candle", leaves: "Leaves", music: "Music", heart: "Heart", waves: "Waves", sun: "Sun", moon: "Moon", butterfly: "Butterfly", anchor: "Anchor",
  paw: "Paw print", trophy: "Trophy", guitar: "Guitar", plane: "Plane", fish: "Fishing", pine: "Pine tree", mountain: "Mountains", camera: "Camera", book: "Books", coffee: "Coffee", car: "Car", cross: "Cross",
  rainbow: "Rainbow", cake: "Cake", rocket: "Rocket", feather: "Feather", wine: "Wine", home: "Home", film: "Film", gamepad: "Games", sprout: "Sprout", bike: "Bicycle", sailboat: "Sailing", piano: "Piano",
};

export const SECTION_LABELS: Record<SectionKey, string> = {
  location: "Location",
  story: "Life Story",
  words: "Their Words",
  photos: "Photos",
  videos: "Videos",
  favourites: "Their World",
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
  frame: "none",
  stickers: [],
  song: null,
  words: null,
  favourites: [],
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

function text(v: unknown, max: number): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}

/** Normalises whatever is stored in `memorials.appearance` into a complete, valid object. */
export function readAppearance(raw: Json | null | undefined): MemorialAppearance {
  const r = record(raw);
  const theme = isKey(THEME_KEYS, r.theme) ? r.theme : DEFAULT_APPEARANCE.theme;
  const font = isKey(FONT_KEYS, r.font) ? r.font : DEFAULT_APPEARANCE.font;
  const hero = isKey(HERO_KEYS, r.hero) ? r.hero : DEFAULT_APPEARANCE.hero;
  const frame = isKey(FRAME_KEYS, r.frame) ? r.frame : DEFAULT_APPEARANCE.frame;

  let background: MemorialBackground | null = null;
  const b = record(r.background);
  if (typeof b.image_path === "string" && b.image_path) {
    background = { image_path: b.image_path, blur: clamp(b.blur, 0, 24, BACKGROUND_DEFAULTS.blur), dim: clamp(b.dim, 0, 90, BACKGROUND_DEFAULTS.dim) };
  }

  const stickers = Array.isArray(r.stickers) ? [...new Set(r.stickers.filter((k): k is MotifKey => isKey(MOTIF_KEYS, k)))].slice(0, MAX_STICKERS) : [];

  let song: MemorialSong | null = null;
  const s = record(r.song);
  const storage_path = text(s.storage_path, 400);
  const external_url = text(s.external_url, 500);
  if (storage_path || (external_url && /^https:\/\//i.test(external_url))) {
    song = { storage_path, external_url: external_url && /^https:\/\//i.test(external_url) ? external_url : null, title: text(s.title, 120) };
  }

  let words: MemorialWords | null = null;
  const w = record(r.words);
  const wordsText = text(w.text, 600);
  if (wordsText) words = { text: wordsText, attribution: text(w.attribution, 120) };

  const favourites: MemorialFavourite[] = Array.isArray(r.favourites)
    ? r.favourites
        .map((f) => {
          const o = record(f);
          const label = text(o.label, 40);
          const value = text(o.value, 120);
          if (!label || !value) return null;
          return { icon: isKey(MOTIF_KEYS, o.icon) ? o.icon : "heart", label, value } satisfies MemorialFavourite;
        })
        .filter((f): f is MemorialFavourite => f !== null)
        .slice(0, MAX_FAVOURITES)
    : [];

  const sec = record(r.sections);
  const rawOrder = Array.isArray(sec.order) ? sec.order.filter((k): k is SectionKey => isKey(SECTION_KEYS, k)) : [];
  const order = [...new Set<SectionKey>([...rawOrder, ...SECTION_KEYS])];
  const hidden = Array.isArray(sec.hidden) ? [...new Set(sec.hidden.filter((k): k is SectionKey => isKey(SECTION_KEYS, k)))] : [];

  return { theme, font, hero, background, frame, stickers, song, words, favourites, sections: { order, hidden } };
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

/** Which streaming service a song link points at, for the "Listen on …" button. */
export function songProvider(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    if (host.includes("spotify.com")) return "Spotify";
    if (host.includes("youtube.com") || host === "youtu.be") return "YouTube";
    if (host.includes("music.apple.com")) return "Apple Music";
    if (host.includes("soundcloud.com")) return "SoundCloud";
    if (host.includes("bandcamp.com")) return "Bandcamp";
    if (host.includes("tidal.com")) return "TIDAL";
    if (host.includes("deezer.com")) return "Deezer";
    return host;
  } catch {
    return "the link";
  }
}

/** A direct audio file link can play in the page; anything else opens the service. */
export function isDirectAudioUrl(url: string): boolean {
  return /\.(mp3|m4a|aac|ogg|wav|webm)(\?.*)?$/i.test(url);
}
