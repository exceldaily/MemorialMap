"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ExternalLink, Eye, EyeOff } from "lucide-react";
import { ImageUploadField } from "@/components/create/ImageUploadField";
import { Avatar } from "@/components/ui/Avatar";
import { updateMemorial } from "@/lib/actions/memorial";
import {
  BACKGROUND_DEFAULTS,
  FONTS,
  FONT_KEYS,
  HERO_KEYS,
  HERO_LAYOUTS,
  SECTION_LABELS,
  THEMES,
  THEME_KEYS,
  accentVars,
  backgroundLayerStyle,
  readAppearance,
  type MemorialAppearance,
  type SectionKey,
} from "@/lib/appearance";
import { lifeYears } from "@/lib/format";
import { imageUrl, publicUrl } from "@/lib/storage";
import type { Memorial } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { planAllows, PlanNotice, SaveBar, Section } from "./shared";

const ACCENTS = ["#d3b877", "#8aa88a", "#a9b8d6", "#d6a0a0", "#c9a0d6", "#e3cf9a", "#7fb3c9", "#e0a06a"];

export function AppearanceTab({ memorial, limits }: { memorial: Memorial; limits: Record<string, unknown> }) {
  const router = useRouter();
  const [a, setA] = useState<MemorialAppearance>(() => readAppearance(memorial.appearance));
  const [accent, setAccent] = useState<string | null>(memorial.accent_color);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const canBackground = planAllows(limits, "custom_appearance");

  function patch(p: Partial<MemorialAppearance>) {
    setA((prev) => ({ ...prev, ...p }));
    setSaved(false);
  }

  function move(key: SectionKey, dir: -1 | 1) {
    const order = [...a.sections.order];
    const i = order.indexOf(key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    patch({ sections: { ...a.sections, order } });
  }

  function toggleHidden(key: SectionKey) {
    const hidden = a.sections.hidden.includes(key) ? a.sections.hidden.filter((k) => k !== key) : [...a.sections.hidden, key];
    patch({ sections: { ...a.sections, hidden } });
  }

  function setBackgroundPath(path: string | null) {
    patch({ background: path ? { image_path: path, blur: a.background?.blur ?? BACKGROUND_DEFAULTS.blur, dim: a.background?.dim ?? BACKGROUND_DEFAULTS.dim } : null });
  }

  function save() {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      const res = await updateMemorial(memorial.id, memorial.slug, { accent_color: accent, appearance: a });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
      <div className="space-y-6">
        <Section title="Theme" description="The overall mood of the page. Every part of the memorial follows it.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4" role="radiogroup" aria-label="Theme">
            {THEME_KEYS.map((key) => {
              const t = THEMES[key];
              const active = a.theme === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => patch({ theme: key })}
                  className={cn("group rounded-2xl border p-2.5 text-left transition", active ? "border-gold-400 bg-gold-400/10" : "border-white/10 hover:border-white/25")}
                >
                  <div className="relative h-16 overflow-hidden rounded-xl" style={{ background: t.swatch.bg }} aria-hidden>
                    <div className="absolute inset-x-2 bottom-2 top-5 rounded-md" style={{ background: t.swatch.surface }} />
                    <div className="absolute left-4 top-7 h-1.5 w-12 rounded-full" style={{ background: t.swatch.text, opacity: 0.85 }} />
                    <div className="absolute left-4 top-10 h-1 w-8 rounded-full" style={{ background: t.swatch.text, opacity: 0.4 }} />
                    <div className="absolute right-3 top-2 h-3 w-3 rounded-full" style={{ background: t.swatch.accent }} />
                  </div>
                  <p className="mt-2 text-sm font-medium text-ivory-50">{t.label}</p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-ivory-500">{t.description}</p>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Accent colour" description="Used for highlights, buttons and the portrait ring. Pick one that felt like them.">
          <div className="flex flex-wrap items-center gap-3" role="radiogroup" aria-label="Accent colour">
            <button
              type="button"
              role="radio"
              aria-checked={accent === null}
              aria-label="Theme default accent"
              onClick={() => {
                setAccent(null);
                setSaved(false);
              }}
              className={cn("flex h-9 w-9 items-center justify-center rounded-full border text-[10px] uppercase tracking-wider", accent === null ? "border-gold-400 text-gold-300" : "border-white/15 text-ivory-500")}
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
                onClick={() => {
                  setAccent(c);
                  setSaved(false);
                }}
                className={cn("h-9 w-9 rounded-full border-2 transition", accent === c ? "scale-110 border-ivory-50" : "border-transparent")}
                style={{ background: c }}
              />
            ))}
            <label className="ml-2 flex items-center gap-2 text-xs text-ivory-400">
              Custom
              <input
                type="color"
                value={accent ?? "#d3b877"}
                onChange={(e) => {
                  setAccent(e.target.value);
                  setSaved(false);
                }}
                className="h-8 w-10 cursor-pointer rounded border border-white/10 bg-transparent"
                aria-label="Custom accent colour"
              />
            </label>
          </div>
        </Section>

        <Section title="Lettering" description="The typeface for their name and headings.">
          <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Lettering">
            {FONT_KEYS.map((key) => {
              const f = FONTS[key];
              const active = a.font === key;
              return (
                <button key={key} type="button" role="radio" aria-checked={active} onClick={() => patch({ font: key })} className={cn("rounded-2xl border p-4 text-left transition", active ? "border-gold-400 bg-gold-400/10" : "border-white/10 hover:border-white/25")}>
                  <p className="truncate text-2xl text-ivory-50" style={{ fontFamily: f.family }}>
                    {memorial.full_name}
                  </p>
                  <p className="mt-2 text-sm font-medium text-ivory-100">{f.label}</p>
                  <p className="text-[11px] text-ivory-500">{f.description}</p>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Header layout" description="How the portrait, cover image and name are arranged at the top of the page.">
          <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Header layout">
            {HERO_KEYS.map((key) => {
              const h = HERO_LAYOUTS[key];
              const active = a.hero === key;
              return (
                <button key={key} type="button" role="radio" aria-checked={active} onClick={() => patch({ hero: key })} className={cn("rounded-2xl border p-3 text-left transition", active ? "border-gold-400 bg-gold-400/10" : "border-white/10 hover:border-white/25")}>
                  <LayoutSketch layout={key} />
                  <p className="mt-2 text-sm font-medium text-ivory-100">{h.label}</p>
                  <p className="text-[11px] leading-snug text-ivory-500">{h.description}</p>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Background photo" description={canBackground ? "A photo behind the whole page, softened so the words stay easy to read." : "Background photos are part of the Premium and Family plans."}>
          {!canBackground && (
            <div className="mb-4">
              <PlanNotice feature="Background photos" />
            </div>
          )}
          <div className={cn("grid gap-6 md:grid-cols-[18rem_1fr]", !canBackground && "pointer-events-none opacity-50")}>
            <ImageUploadField label="Background" bucket="memorial-cover-images" value={a.background?.image_path ?? null} onChange={setBackgroundPath} shape="wide" altName={memorial.full_name} maxEdge={2400} />
            <div className="space-y-5">
              <RangeField label="Softness" value={a.background?.blur ?? BACKGROUND_DEFAULTS.blur} min={0} max={24} step={2} disabled={!a.background} onChange={(blur) => a.background && patch({ background: { ...a.background, blur } })} />
              <RangeField label="Darken" value={a.background?.dim ?? BACKGROUND_DEFAULTS.dim} min={0} max={90} step={5} suffix="%" disabled={!a.background} onChange={(dim) => a.background && patch({ background: { ...a.background, dim } })} />
              {!a.background && <p className="text-xs text-ivory-500">Add a photo to adjust softness and darkening.</p>}
            </div>
          </div>
        </Section>

        <Section title="Sections" description="Choose the order the page tells their story in, and hide anything you would rather leave out.">
          <ul className="divide-y divide-white/8 rounded-2xl border border-white/8">
            {a.sections.order.map((key, i) => {
              const hidden = a.sections.hidden.includes(key);
              return (
                <li key={key} className={cn("flex items-center gap-3 px-3 py-2.5", hidden && "opacity-60")}>
                  <span className="w-6 text-center text-xs tabular-nums text-ivory-500">{i + 1}</span>
                  <span className={cn("flex-1 text-sm", hidden ? "text-ivory-400 line-through" : "text-ivory-100")}>{SECTION_LABELS[key]}</span>
                  <button type="button" className="btn-ghost h-8 w-8 rounded-full p-0" onClick={() => move(key, -1)} disabled={i === 0} aria-label={`Move ${SECTION_LABELS[key]} up`}>
                    <ArrowUp size={15} />
                  </button>
                  <button type="button" className="btn-ghost h-8 w-8 rounded-full p-0" onClick={() => move(key, 1)} disabled={i === a.sections.order.length - 1} aria-label={`Move ${SECTION_LABELS[key]} down`}>
                    <ArrowDown size={15} />
                  </button>
                  <button type="button" className="btn-ghost h-8 w-8 rounded-full p-0" onClick={() => toggleHidden(key)} aria-pressed={hidden} aria-label={hidden ? `Show ${SECTION_LABELS[key]}` : `Hide ${SECTION_LABELS[key]}`}>
                    {hidden ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-ivory-500">Sections with nothing in them yet stay hidden automatically.</p>
        </Section>

        <div className="sticky bottom-0 z-10 -mx-4 border-t border-white/8 bg-navy-900/95 px-4 pb-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-6">
          <SaveBar pending={pending} saved={saved} error={error} onSave={save} />
        </div>
      </div>

      <aside className="space-y-3 lg:sticky lg:top-24">
        <p className="eyebrow">Live preview</p>
        <Preview memorial={memorial} a={a} accent={accent} />
        <Link href={`/memorial/${memorial.slug}`} target="_blank" className="btn-secondary w-full">
          <ExternalLink size={15} /> Open the memorial
        </Link>
      </aside>
    </div>
  );
}

/* ---- Bits ------------------------------------------------------------ */

function RangeField({ label, value, min, max, step, suffix, disabled, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix?: string; disabled?: boolean; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="label flex items-center justify-between">
        {label}
        <span className="normal-case tracking-normal text-ivory-300">
          {value}
          {suffix}
        </span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-gold-400 disabled:opacity-40" />
    </label>
  );
}

function LayoutSketch({ layout }: { layout: MemorialAppearance["hero"] }) {
  return (
    <div className="relative h-16 overflow-hidden rounded-xl bg-navy-950 ring-1 ring-white/8" aria-hidden>
      {layout === "centered" && (
        <>
          <div className="absolute inset-x-0 top-0 h-7 bg-gold-400/25" />
          <div className="absolute left-1/2 top-4 h-6 w-6 -translate-x-1/2 rounded-full bg-gold-400 ring-2 ring-navy-950" />
          <div className="absolute left-1/2 top-11 h-1.5 w-12 -translate-x-1/2 rounded-full bg-ivory-100/80" />
        </>
      )}
      {layout === "cover" && (
        <>
          <div className="absolute inset-x-0 top-0 h-12 bg-gold-400/25" />
          <div className="absolute bottom-3 left-3 h-5 w-5 rounded-full bg-gold-400 ring-2 ring-navy-950" />
          <div className="absolute bottom-6 left-10 h-1.5 w-14 rounded-full bg-ivory-100/80" />
          <div className="absolute bottom-3 left-10 h-1 w-8 rounded-full bg-ivory-100/40" />
        </>
      )}
      {layout === "split" && (
        <>
          <div className="absolute bottom-3 left-3 top-3 w-9 rounded-md bg-gold-400" />
          <div className="absolute left-15 top-5 h-1.5 w-14 rounded-full bg-ivory-100/80" />
          <div className="absolute left-15 top-8 h-1 w-9 rounded-full bg-ivory-100/40" />
          <div className="absolute left-15 top-11 h-1 w-12 rounded-full bg-ivory-100/25" />
        </>
      )}
    </div>
  );
}

/** A scaled-down mock of the memorial page that uses the real tokens, so what you see is what you get. */
function Preview({ memorial, a, accent }: { memorial: Memorial; a: MemorialAppearance; accent: string | null }) {
  const theme = THEMES[a.theme];
  const bgUrl = a.background?.image_path ? publicUrl(a.background.image_path) : null;
  const cover = imageUrl(memorial.cover_image_path, { width: 800, quality: 70 });
  const portrait = imageUrl(memorial.profile_image_path, { width: 400, quality: 75 });
  const years = lifeYears(memorial.birth_year, memorial.death_year, memorial.memorial_type);
  const visible = a.sections.order.filter((k) => !a.sections.hidden.includes(k));

  return (
    <div className={cn("memorial-page overflow-hidden rounded-2xl border border-white/10 shadow-soft", theme.light && "is-light", bgUrl && "has-bg")} data-theme={a.theme} data-font={a.font} style={accentVars(accent)}>
      <div className="relative">
        {bgUrl && a.background && <div aria-hidden className="memorial-bg is-inline" style={backgroundLayerStyle(a.background, bgUrl)} />}
        <div className="relative">
          {/* Hero mock */}
          {a.hero === "centered" && (
            <div className="text-center">
              <div className="h-16 bg-navy-950 bg-cover bg-center" style={cover ? { backgroundImage: `url("${cover}")` } : undefined}>
                <div className="h-full w-full bg-gradient-to-t from-navy-900 to-transparent" />
              </div>
              <div className="-mt-7 inline-block rounded-full bg-navy-900 p-1">
                <Avatar path={memorial.profile_image_path} name={memorial.full_name} size={52} className="ring-2 ring-gold-400/60" />
              </div>
              <h3 className="mt-1 px-3 text-xl leading-tight text-ivory-50">{memorial.full_name}</h3>
              {years && <p className="font-display text-xs tracking-wide text-gold-300">{years}</p>}
              <p className="mt-1 px-4 font-display text-sm italic text-ivory-200">&ldquo;{memorial.epitaph}&rdquo;</p>
            </div>
          )}
          {a.hero === "cover" && (
            <div className="relative h-28 bg-navy-950 bg-cover bg-center" style={cover ? { backgroundImage: `url("${cover}")` } : undefined}>
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/60 to-transparent" />
              <div className="absolute bottom-2 left-3 flex items-end gap-2">
                <Avatar path={memorial.profile_image_path} name={memorial.full_name} size={36} className="ring-2 ring-gold-400/60" />
                <div>
                  <h3 className="text-lg leading-tight text-ivory-50">{memorial.full_name}</h3>
                  {years && <p className="font-display text-[11px] text-gold-300">{years}</p>}
                </div>
              </div>
            </div>
          )}
          {a.hero === "split" && (
            <div className="grid grid-cols-[4.5rem_1fr] items-center gap-3 p-3">
              {portrait ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={portrait} alt="" className="aspect-[4/5] w-full rounded-lg object-cover ring-2 ring-gold-400/60" />
              ) : (
                <Avatar path={null} name={memorial.full_name} size={64} />
              )}
              <div className="min-w-0">
                <h3 className="text-lg leading-tight text-ivory-50">{memorial.full_name}</h3>
                {years && <p className="font-display text-[11px] text-gold-300">{years}</p>}
                <p className="mt-1 line-clamp-2 font-display text-xs italic text-ivory-200">&ldquo;{memorial.epitaph}&rdquo;</p>
              </div>
            </div>
          )}

          {/* Section nav mock */}
          <div className="mt-3 flex gap-1 overflow-hidden border-y border-white/5 bg-navy-900/85 px-2 py-1.5">
            {visible.map((k) => (
              <span key={k} className="shrink-0 rounded-full px-2 py-0.5 text-[10px] text-ivory-300">
                {SECTION_LABELS[k]}
              </span>
            ))}
          </div>

          {/* Body mock */}
          <div className="space-y-3 p-3">
            <p className="eyebrow text-[9px]">{SECTION_LABELS[visible[0] ?? "story"]}</p>
            <div className="card space-y-2 p-3">
              <div className="h-1.5 w-3/4 rounded-full bg-ivory-100/60" />
              <div className="h-1.5 w-full rounded-full bg-ivory-100/25" />
              <div className="h-1.5 w-5/6 rounded-full bg-ivory-100/25" />
            </div>
            <div className="flex items-center gap-2">
              <span className="btn-primary px-3 py-1 text-[10px]">Light a candle</span>
              <span className="btn-secondary px-3 py-1 text-[10px]">Share</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
