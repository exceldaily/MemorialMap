"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { updateMemorial } from "@/lib/actions/memorial";
import { MAX_FAVOURITES, MOTIF_KEYS, MOTIF_LABELS, readAppearance, type MemorialFavourite, type MemorialSong, type MemorialWords, type MotifKey } from "@/lib/appearance";
import type { Memorial } from "@/lib/supabase/types";
import { MOTIF_ICONS } from "@/components/memorial/motifs";
import { SongPlayer } from "@/components/memorial/SongPlayer";
import { publicUrl } from "@/lib/storage";
import { AudioUploadField } from "./AudioUploadField";
import { planAllows, PlanNotice, SaveBar, Section } from "./shared";

const EMPTY_SONG: MemorialSong = { storage_path: null, external_url: null, title: null };

const FAVOURITE_IDEAS = ["Favourite song", "Favourite place", "Their team", "Signature dish", "Always said", "Best trip", "Sunday ritual", "Favourite film"];

export function TouchesTab({ memorial, limits }: { memorial: Memorial; limits: Record<string, unknown> }) {
  const router = useRouter();
  const initial = readAppearance(memorial.appearance);
  const [song, setSong] = useState<MemorialSong>(initial.song ?? EMPTY_SONG);
  const [words, setWords] = useState<MemorialWords>(initial.words ?? { text: "", attribution: null });
  const [favourites, setFavourites] = useState<MemorialFavourite[]>(initial.favourites);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const canSong = planAllows(limits, "custom_appearance");

  const touch = () => setSaved(false);

  function setFav(i: number, patch: Partial<MemorialFavourite>) {
    setFavourites((list) => list.map((f, j) => (j === i ? { ...f, ...patch } : f)));
    touch();
  }
  function moveFav(i: number, dir: -1 | 1) {
    setFavourites((list) => {
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    touch();
  }
  function addFav() {
    if (favourites.length >= MAX_FAVOURITES) return;
    setFavourites((list) => [...list, { icon: "heart", label: FAVOURITE_IDEAS[list.length % FAVOURITE_IDEAS.length], value: "" }]);
    touch();
  }
  function removeFav(i: number) {
    setFavourites((list) => list.filter((_, j) => j !== i));
    touch();
  }

  function save() {
    setSaved(false);
    setError(null);
    const url = song.external_url?.trim() || null;
    if (url && !/^https:\/\/\S+$/i.test(url)) {
      setError("The song link needs to start with https://");
      return;
    }
    const cleanFavourites = favourites.map((f) => ({ ...f, label: f.label.trim(), value: f.value.trim() })).filter((f) => f.label && f.value);
    const hasSong = Boolean(song.storage_path || url);
    startTransition(async () => {
      const res = await updateMemorial(memorial.id, memorial.slug, {
        appearance: {
          song: hasSong ? { storage_path: song.storage_path, external_url: url, title: song.title?.trim() || null } : null,
          words: words.text.trim() ? { text: words.text.trim(), attribution: words.attribution?.trim() || null } : null,
          favourites: cleanFavourites,
        },
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setFavourites(cleanFavourites);
      setSaved(true);
      router.refresh();
    });
  }

  const previewSrc = song.storage_path ? publicUrl(song.storage_path) : null;

  return (
    <div className="space-y-6">
      <Section title="Their song" description={canSong ? "A track that brings them back. Visitors press play; it never starts on its own." : "A memorial song is part of the Premium and Family plans."}>
        {!canSong && (
          <div className="mb-4">
            <PlanNotice feature="Memorial songs" />
          </div>
        )}
        <div className="grid gap-6 md:grid-cols-2">
          <AudioUploadField
            label="Upload a track"
            value={song.storage_path}
            disabled={!canSong}
            onChange={(path) => {
              setSong((s) => ({ ...s, storage_path: path }));
              touch();
            }}
          />
          <div className="space-y-4">
            <label className="block">
              <span className="label">Title</span>
              <input
                className="input"
                value={song.title ?? ""}
                disabled={!canSong}
                maxLength={120}
                placeholder="e.g. What a Wonderful World"
                onChange={(e) => {
                  setSong((s) => ({ ...s, title: e.target.value }));
                  touch();
                }}
              />
            </label>
            <label className="block">
              <span className="label">Or a link</span>
              <input
                className="input"
                type="url"
                inputMode="url"
                value={song.external_url ?? ""}
                disabled={!canSong}
                maxLength={500}
                placeholder="https://open.spotify.com/track/…"
                onChange={(e) => {
                  setSong((s) => ({ ...s, external_url: e.target.value }));
                  touch();
                }}
              />
              <span className="mt-1 block text-xs text-ivory-500">Spotify, YouTube, Apple Music and the like open in a new tab. A direct MP3 link plays in the page.</span>
            </label>
          </div>
        </div>
        {(previewSrc || song.external_url) && (
          <div className="mt-5">
            <p className="label">How it will look</p>
            <SongPlayer src={previewSrc} external={song.external_url?.trim() || null} title={song.title?.trim() || null} name={memorial.first_name} />
          </div>
        )}
      </Section>

      <Section title="Their words" description="A saying, a verse, a line they always came back to. Shown large in the memorial's lettering.">
        <div className="grid gap-4 md:grid-cols-[1fr_16rem]">
          <label className="block">
            <span className="label">The words</span>
            <textarea
              className="input min-h-28 resize-y"
              value={words.text}
              maxLength={600}
              placeholder="Don't count the days. Make the days count."
              onChange={(e) => {
                setWords((w) => ({ ...w, text: e.target.value }));
                touch();
              }}
            />
            <span className="mt-1 block text-right text-[11px] text-ivory-500">{words.text.length}/600</span>
          </label>
          <label className="block">
            <span className="label">Who said it</span>
            <input
              className="input"
              value={words.attribution ?? ""}
              maxLength={120}
              placeholder={`${memorial.first_name}, every morning`}
              onChange={(e) => {
                setWords((w) => ({ ...w, attribution: e.target.value }));
                touch();
              }}
            />
          </label>
        </div>
      </Section>

      <Section
        title={`${memorial.first_name}'s world`}
        description="The favourite things that made up their world: a song, a place, a team, a dish, a saying. Shown as tiles."
        actions={
          <button type="button" className="btn-secondary" onClick={addFav} disabled={favourites.length >= MAX_FAVOURITES}>
            <Plus size={15} /> Add a favourite
          </button>
        }
      >
        {favourites.length === 0 ? (
          <p className="text-sm text-ivory-500">Nothing yet. Add up to {MAX_FAVOURITES}.</p>
        ) : (
          <ul className="space-y-3">
            {favourites.map((f, i) => {
              const Icon = MOTIF_ICONS[f.icon];
              return (
                <li key={i} className="grid gap-2 rounded-2xl border border-white/8 p-3 sm:grid-cols-[2.5rem_11rem_1fr_auto] sm:items-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-400/15 text-gold-400" aria-hidden>
                    <Icon size={18} />
                  </span>
                  <div className="grid gap-2 sm:contents">
                    <select className="input py-2" value={f.icon} onChange={(e) => setFav(i, { icon: e.target.value as MotifKey })} aria-label="Icon">
                      {MOTIF_KEYS.map((k) => (
                        <option key={k} value={k}>
                          {MOTIF_LABELS[k]}
                        </option>
                      ))}
                    </select>
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,10rem)_1fr]">
                      <input className="input py-2" value={f.label} maxLength={40} placeholder="Label" onChange={(e) => setFav(i, { label: e.target.value })} aria-label="Label" />
                      <input className="input py-2" value={f.value} maxLength={120} placeholder="Their answer" onChange={(e) => setFav(i, { value: e.target.value })} aria-label="Value" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 justify-self-end">
                    <button type="button" className="btn-ghost h-8 w-8 rounded-full p-0" onClick={() => moveFav(i, -1)} disabled={i === 0} aria-label="Move up">
                      <ArrowUp size={15} />
                    </button>
                    <button type="button" className="btn-ghost h-8 w-8 rounded-full p-0" onClick={() => moveFav(i, 1)} disabled={i === favourites.length - 1} aria-label="Move down">
                      <ArrowDown size={15} />
                    </button>
                    <button type="button" className="btn-ghost h-8 w-8 rounded-full p-0 text-danger-400" onClick={() => removeFav(i)} aria-label="Remove">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-white/8 bg-navy-900/95 px-4 pb-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-6">
        <SaveBar pending={pending} saved={saved} error={error} onSave={save} />
      </div>
    </div>
  );
}
