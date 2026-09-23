"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseAdminClient, getSessionUser } from "@/lib/supabase/server";
import type { CheckLocationResult, CreateMemorialInput, Json, FamilyGroup, Memorial, MemorialAdmin, MemorialPhoto, MemorialVideo, TimelineEvent, FamilyRelationship } from "@/lib/supabase/types";
import { errorMessage } from "@/lib/utils";
import { FONT_KEYS, HERO_KEYS, SECTION_KEYS, THEME_KEYS } from "@/lib/appearance";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

/* ---- Shared schemas ---------------------------------------------------- */

const uuid = z.string().uuid("Invalid identifier");
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD")
  .refine((s) => !Number.isNaN(new Date(s).getTime()), "That date is not valid");
const yearSchema = z.number().int().min(1, "Year must be after 0").max(2200, "Year is too far in the future");
const privacySchema = z.enum(["public", "unlisted", "private"]);
const memorialTypeSchema = z.enum(["deceased", "living"]);
const accentColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{6})$/, "Accent colour must be a hex value like #d3b877")
  .nullable()
  .optional();

const sectionKeySchema = z.enum(SECTION_KEYS);
const appearanceSchema = z
  .object({
    theme: z.enum(THEME_KEYS).optional(),
    font: z.enum(FONT_KEYS).optional(),
    hero: z.enum(HERO_KEYS).optional(),
    background: z
      .object({ image_path: z.string().max(400).nullable().optional(), blur: z.number().min(0).max(24).optional(), dim: z.number().min(0).max(90).optional() })
      .nullable()
      .optional(),
    sections: z.object({ order: z.array(sectionKeySchema).max(8).optional(), hidden: z.array(sectionKeySchema).max(8).optional() }).optional(),
  })
  .strict();

const memorialFieldsSchema = z.object({
  memorial_type: memorialTypeSchema.optional(),
  first_name: z.string().trim().min(1, "First name is required").max(80),
  middle_name: optionalText(80),
  last_name: z.string().trim().min(1, "Last name is required").max(80),
  nickname: optionalText(80),
  birth_date: isoDate.nullable().optional(),
  birth_year: yearSchema.nullable().optional(),
  birth_unknown: z.boolean().optional(),
  death_date: isoDate.nullable().optional(),
  death_year: yearSchema.nullable().optional(),
  death_unknown: z.boolean().optional(),
  epitaph: z.string().trim().max(200, "Epitaphs are limited to 200 characters").nullable().optional(),
  biography: optionalText(20000),
  known_for: optionalText(4000),
  loved: optionalText(4000),
  made_them_laugh: optionalText(4000),
  remember_them_for: optionalText(4000),
  profile_image_path: optionalText(400),
  cover_image_path: optionalText(400),
  resting_place: optionalText(300),
  privacy: privacySchema.optional(),
  family_group_id: uuid.nullable().optional(),
});

function firstIssue(err: z.ZodError, fallback: string) {
  return err.issues[0]?.message ?? fallback;
}

/** Derive years from full dates and clear dates for unknowns so the row stays consistent. */
function normaliseDates<T extends z.infer<typeof memorialFieldsSchema>>(d: T): T {
  const out = { ...d };
  if (out.birth_unknown) {
    out.birth_date = null;
    out.birth_year = null;
  } else if (out.birth_date) {
    out.birth_year = Number(out.birth_date.slice(0, 4));
  }
  if (out.death_unknown || out.memorial_type === "living") {
    out.death_date = null;
    out.death_year = null;
  } else if (out.death_date) {
    out.death_year = Number(out.death_date.slice(0, 4));
  }
  if (out.birth_year && out.death_year && out.death_year < out.birth_year) {
    throw new Error("The date of passing cannot be before the date of birth.");
  }
  return out;
}

function revalidateMemorial(slug?: string | null) {
  if (slug) revalidatePath(`/memorial/${slug}`);
  revalidatePath("/dashboard");
}

/* ---- Memorial lifecycle ------------------------------------------------ */

export async function createMemorialDraft(input: CreateMemorialInput): Promise<ActionResult<Memorial>> {
  const parsed = memorialFieldsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error, "Please check the details you entered") };
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Sign in to create a memorial." };
  let data: z.infer<typeof memorialFieldsSchema>;
  try {
    data = normaliseDates(parsed.data);
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
  const payload: CreateMemorialInput = {
    ...data,
    epitaph: data.epitaph?.trim() || "Forever remembered.",
  };
  const { data: memorial, error } = await supabase.rpc("create_memorial", { p_input: payload });
  if (error) return { ok: false, error: errorMessage(error) };
  revalidatePath("/dashboard");
  return { ok: true, data: memorial };
}

const updateSchema = memorialFieldsSchema.partial().extend({ accent_color: accentColor, appearance: appearanceSchema.optional() });
export type UpdateMemorialFields = z.infer<typeof updateSchema>;

export async function updateMemorial(id: string, slug: string, fields: UpdateMemorialFields): Promise<ActionResult<Memorial>> {
  if (!uuid.safeParse(id).success) return { ok: false, error: "Invalid memorial" };
  const parsed = updateSchema.safeParse(fields);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error, "Please check the details you entered") };
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };

  // Merge with the current row so the date consistency rules see the full picture.
  const { data: current } = await supabase.from("memorials").select("*").eq("id", id).maybeSingle();
  if (!current) return { ok: false, error: "Memorial not found" };
  let merged: z.infer<typeof memorialFieldsSchema>;
  try {
    merged = normaliseDates({
      memorial_type: parsed.data.memorial_type ?? current.memorial_type,
      first_name: parsed.data.first_name ?? current.first_name,
      last_name: parsed.data.last_name ?? current.last_name,
      birth_date: parsed.data.birth_date !== undefined ? parsed.data.birth_date : current.birth_date,
      birth_year: parsed.data.birth_year !== undefined ? parsed.data.birth_year : current.birth_year,
      birth_unknown: parsed.data.birth_unknown ?? current.birth_unknown,
      death_date: parsed.data.death_date !== undefined ? parsed.data.death_date : current.death_date,
      death_year: parsed.data.death_year !== undefined ? parsed.data.death_year : current.death_year,
      death_unknown: parsed.data.death_unknown ?? current.death_unknown,
    });
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }

  const update: Partial<Memorial> = {};
  const p = parsed.data;
  if (p.first_name !== undefined) update.first_name = p.first_name;
  if (p.middle_name !== undefined) update.middle_name = p.middle_name || null;
  if (p.last_name !== undefined) update.last_name = p.last_name;
  if (p.nickname !== undefined) update.nickname = p.nickname || null;
  if (p.memorial_type !== undefined) update.memorial_type = p.memorial_type;
  if (p.epitaph !== undefined) update.epitaph = p.epitaph?.trim() || "Forever remembered.";
  if (p.biography !== undefined) update.biography = p.biography || null;
  if (p.known_for !== undefined) update.known_for = p.known_for || null;
  if (p.loved !== undefined) update.loved = p.loved || null;
  if (p.made_them_laugh !== undefined) update.made_them_laugh = p.made_them_laugh || null;
  if (p.remember_them_for !== undefined) update.remember_them_for = p.remember_them_for || null;
  if (p.profile_image_path !== undefined) update.profile_image_path = p.profile_image_path || null;
  if (p.cover_image_path !== undefined) update.cover_image_path = p.cover_image_path || null;
  if (p.resting_place !== undefined) update.resting_place = p.resting_place || null;
  if (p.accent_color !== undefined) update.accent_color = p.accent_color || null;
  if (p.appearance !== undefined) {
    const next = { ...p.appearance };
    if (next.background?.image_path) {
      // Background photos belong to the upgraded plans; drop them quietly otherwise.
      const { data: limits } = await supabase.rpc("plan_limits", {});
      if ((limits as Record<string, unknown> | null)?.custom_appearance === false) next.background = null;
    }
    update.appearance = next as Json;
  }
  if (p.family_group_id !== undefined) update.family_group_id = p.family_group_id;
  if (p.privacy !== undefined) {
    if (current.owner_id !== user.id) return { ok: false, error: "Only the owner can change who can see this memorial." };
    update.privacy = p.privacy;
  }
  const touchesDates = ["birth_date", "birth_year", "birth_unknown", "death_date", "death_year", "death_unknown", "memorial_type"].some((k) => (p as Record<string, unknown>)[k] !== undefined);
  if (touchesDates) {
    update.birth_date = merged.birth_date ?? null;
    update.birth_year = merged.birth_year ?? null;
    update.birth_unknown = Boolean(merged.birth_unknown);
    update.death_date = merged.death_date ?? null;
    update.death_year = merged.death_year ?? null;
    update.death_unknown = Boolean(merged.death_unknown);
  }

  const { data, error } = await supabase.from("memorials").update(update).eq("id", id).select("*").single();
  if (error) return { ok: false, error: errorMessage(error) };
  revalidateMemorial(slug);
  revalidatePath(`/memorial/${slug}/edit`);
  return { ok: true, data };
}

export async function claimLocation(memorialId: string, lat: number, lng: number, placeName: string | null): Promise<ActionResult<CheckLocationResult>> {
  const schema = z.object({ memorialId: uuid, lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), placeName: z.string().trim().max(300).nullable() });
  const parsed = schema.safeParse({ memorialId, lat, lng, placeName });
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error, "Invalid location") };
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const { data, error } = await supabase.rpc("claim_location", {
    p_memorial_id: parsed.data.memorialId,
    p_latitude: parsed.data.lat,
    p_longitude: parsed.data.lng,
    p_place_name: parsed.data.placeName || null,
  });
  if (error) return { ok: false, error: errorMessage(error) };
  const { data: m } = await supabase.from("memorials").select("slug").eq("id", memorialId).maybeSingle();
  revalidateMemorial(m?.slug);
  revalidatePath("/map");
  return { ok: true, data: data as CheckLocationResult };
}

export async function publishMemorial(id: string): Promise<ActionResult<Memorial>> {
  if (!uuid.safeParse(id).success) return { ok: false, error: "Invalid memorial" };
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const { data, error } = await supabase.rpc("publish_memorial", { p_memorial_id: id });
  if (error) return { ok: false, error: errorMessage(error) };
  revalidateMemorial(data?.slug);
  revalidatePath("/map");
  return { ok: true, data };
}

export async function deleteMemorial(id: string): Promise<ActionResult> {
  if (!uuid.safeParse(id).success) return { ok: false, error: "Invalid memorial" };
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const { data: memorial } = await supabase.from("memorials").select("id, slug, owner_id").eq("id", id).maybeSingle();
  if (!memorial) return { ok: false, error: "Memorial not found" };
  if (memorial.owner_id !== user.id) return { ok: false, error: "Only the owner can delete this memorial." };
  const { error } = await supabase.from("memorials").delete().eq("id", id);
  if (error) return { ok: false, error: errorMessage(error) };
  revalidateMemorial(memorial.slug);
  revalidatePath("/map");
  redirect("/dashboard");
}

/* ---- Photos ------------------------------------------------------------ */

const photoMetaSchema = z.object({
  caption: optionalText(500),
  year: yearSchema.nullable().optional(),
  location: optionalText(200),
  people_shown: optionalText(300),
  sort_order: z.number().int().min(0).optional(),
});

export async function addPhoto(input: { memorial_id: string; slug: string; storage_path: string; width?: number | null; height?: number | null; byte_size?: number | null } & z.infer<typeof photoMetaSchema>): Promise<ActionResult<MemorialPhoto>> {
  const schema = photoMetaSchema.extend({ memorial_id: uuid, slug: z.string().min(1), storage_path: z.string().min(1).max(400), width: z.number().int().nullable().optional(), height: z.number().int().nullable().optional(), byte_size: z.number().int().nullable().optional() });
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error, "Invalid photo") };
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const d = parsed.data;
  let sort = d.sort_order;
  if (sort === undefined) {
    const { data: last } = await supabase.from("memorial_photos").select("sort_order").eq("memorial_id", d.memorial_id).order("sort_order", { ascending: false }).limit(1).maybeSingle();
    sort = (last?.sort_order ?? -1) + 1;
  }
  const { data, error } = await supabase
    .from("memorial_photos")
    .insert({
      memorial_id: d.memorial_id,
      uploaded_by: user.id,
      storage_path: d.storage_path,
      caption: d.caption || null,
      year: d.year ?? null,
      location: d.location || null,
      people_shown: d.people_shown || null,
      width: d.width ?? null,
      height: d.height ?? null,
      byte_size: d.byte_size ?? null,
      sort_order: sort,
      status: "approved",
    })
    .select("*")
    .single();
  if (error) return { ok: false, error: errorMessage(error) };
  revalidateMemorial(d.slug);
  return { ok: true, data };
}

export async function updatePhoto(input: { id: string; slug: string } & z.infer<typeof photoMetaSchema>): Promise<ActionResult<MemorialPhoto>> {
  const parsed = photoMetaSchema.extend({ id: uuid, slug: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error, "Invalid photo details") };
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const d = parsed.data;
  const update: Partial<MemorialPhoto> = {};
  if (d.caption !== undefined) update.caption = d.caption || null;
  if (d.year !== undefined) update.year = d.year;
  if (d.location !== undefined) update.location = d.location || null;
  if (d.people_shown !== undefined) update.people_shown = d.people_shown || null;
  if (d.sort_order !== undefined) update.sort_order = d.sort_order;
  const { data, error } = await supabase.from("memorial_photos").update(update).eq("id", d.id).select("*").single();
  if (error) return { ok: false, error: errorMessage(error) };
  revalidateMemorial(d.slug);
  return { ok: true, data };
}

/** Persist a full ordering in one call (used by the up/down reorder controls). */
export async function reorderPhotos(input: { slug: string; order: { id: string; sort_order: number }[] }): Promise<ActionResult> {
  const parsed = z.object({ slug: z.string().min(1), order: z.array(z.object({ id: uuid, sort_order: z.number().int().min(0) })).max(500) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid order" };
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  for (const row of parsed.data.order) {
    const { error } = await supabase.from("memorial_photos").update({ sort_order: row.sort_order }).eq("id", row.id);
    if (error) return { ok: false, error: errorMessage(error) };
  }
  revalidateMemorial(parsed.data.slug);
  return { ok: true };
}

async function removeStorageObject(path: string | null | undefined) {
  if (!path) return;
  const admin = createSupabaseAdminClient();
  if (!admin) return;
  const [bucket, ...rest] = path.split("/");
  if (!bucket || rest.length === 0) return;
  try {
    await admin.storage.from(bucket).remove([rest.join("/")]);
  } catch {
    /* storage cleanup is best-effort */
  }
}

export async function deletePhoto(input: { id: string; slug: string }): Promise<ActionResult> {
  const parsed = z.object({ id: uuid, slug: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid photo" };
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const { data: photo } = await supabase.from("memorial_photos").select("storage_path").eq("id", parsed.data.id).maybeSingle();
  const { error } = await supabase.from("memorial_photos").delete().eq("id", parsed.data.id);
  if (error) return { ok: false, error: errorMessage(error) };
  await removeStorageObject(photo?.storage_path);
  revalidateMemorial(parsed.data.slug);
  return { ok: true };
}

/* ---- Videos ------------------------------------------------------------ */

const EXTERNAL_VIDEO = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com)\/.+/i;

export async function addVideo(input: { memorial_id: string; slug: string; external_url?: string | null; storage_path?: string | null; title?: string | null; description?: string | null; byte_size?: number | null }): Promise<ActionResult<MemorialVideo>> {
  const schema = z
    .object({
      memorial_id: uuid,
      slug: z.string().min(1),
      external_url: z.string().trim().max(500).nullable().optional(),
      storage_path: z.string().trim().max(400).nullable().optional(),
      title: optionalText(150),
      description: optionalText(2000),
      byte_size: z.number().int().nullable().optional(),
    })
    .refine((v) => Boolean(v.external_url || v.storage_path), { message: "Add a YouTube or Vimeo link, or upload a video." })
    .refine((v) => !v.external_url || EXTERNAL_VIDEO.test(v.external_url), { message: "Only YouTube and Vimeo links are supported." });
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error, "Invalid video") };
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const d = parsed.data;
  const { data: last } = await supabase.from("memorial_videos").select("sort_order").eq("memorial_id", d.memorial_id).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await supabase
    .from("memorial_videos")
    .insert({
      memorial_id: d.memorial_id,
      uploaded_by: user.id,
      external_url: d.external_url ? (d.external_url.startsWith("http") ? d.external_url : `https://${d.external_url}`) : null,
      storage_path: d.storage_path || null,
      title: d.title || null,
      description: d.description || null,
      byte_size: d.byte_size ?? null,
      sort_order: (last?.sort_order ?? -1) + 1,
      status: "approved",
    })
    .select("*")
    .single();
  if (error) return { ok: false, error: errorMessage(error) };
  revalidateMemorial(d.slug);
  return { ok: true, data };
}

export async function deleteVideo(input: { id: string; slug: string }): Promise<ActionResult> {
  const parsed = z.object({ id: uuid, slug: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid video" };
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const { data: video } = await supabase.from("memorial_videos").select("storage_path").eq("id", parsed.data.id).maybeSingle();
  const { error } = await supabase.from("memorial_videos").delete().eq("id", parsed.data.id);
  if (error) return { ok: false, error: errorMessage(error) };
  await removeStorageObject(video?.storage_path);
  revalidateMemorial(parsed.data.slug);
  return { ok: true };
}

/* ---- Timeline ----------------------------------------------------------- */

const timelineSchema = z.object({
  year: yearSchema,
  event_date: isoDate.nullable().optional(),
  title: z.string().trim().min(1, "Give the event a title").max(150),
  description: optionalText(2000),
  sort_order: z.number().int().min(0).optional(),
});

export async function addTimelineEvent(input: { memorial_id: string; slug: string } & z.infer<typeof timelineSchema>): Promise<ActionResult<TimelineEvent>> {
  const parsed = timelineSchema.extend({ memorial_id: uuid, slug: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error, "Invalid event") };
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const d = parsed.data;
  const { data, error } = await supabase
    .from("timeline_events")
    .insert({ memorial_id: d.memorial_id, year: d.year, event_date: d.event_date || null, title: d.title, description: d.description || null, sort_order: d.sort_order ?? 0 })
    .select("*")
    .single();
  if (error) return { ok: false, error: errorMessage(error) };
  revalidateMemorial(d.slug);
  return { ok: true, data };
}

export async function updateTimelineEvent(input: { id: string; slug: string } & Partial<z.infer<typeof timelineSchema>>): Promise<ActionResult<TimelineEvent>> {
  const parsed = timelineSchema.partial().extend({ id: uuid, slug: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error, "Invalid event") };
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const d = parsed.data;
  const update: Partial<TimelineEvent> = {};
  if (d.year !== undefined) update.year = d.year;
  if (d.event_date !== undefined) update.event_date = d.event_date || null;
  if (d.title !== undefined) update.title = d.title;
  if (d.description !== undefined) update.description = d.description || null;
  if (d.sort_order !== undefined) update.sort_order = d.sort_order;
  const { data, error } = await supabase.from("timeline_events").update(update).eq("id", d.id).select("*").single();
  if (error) return { ok: false, error: errorMessage(error) };
  revalidateMemorial(d.slug);
  return { ok: true, data };
}

export async function deleteTimelineEvent(input: { id: string; slug: string }): Promise<ActionResult> {
  const parsed = z.object({ id: uuid, slug: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid event" };
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const { error } = await supabase.from("timeline_events").delete().eq("id", parsed.data.id);
  if (error) return { ok: false, error: errorMessage(error) };
  revalidateMemorial(parsed.data.slug);
  return { ok: true };
}

/* ---- Family relationships ---------------------------------------------- */

const relationshipType = z.enum(["parent", "child", "spouse", "sibling", "grandparent", "grandchild", "other"]);

export async function addFamilyRelationship(memorialId: string, relatedMemorialSlugOrId: string, type: z.infer<typeof relationshipType>, label?: string | null, slug?: string): Promise<ActionResult<FamilyRelationship>> {
  const parsed = z
    .object({ memorialId: uuid, related: z.string().trim().min(1, "Choose a memorial to connect"), type: relationshipType, label: optionalText(80) })
    .safeParse({ memorialId, related: relatedMemorialSlugOrId, type, label });
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error, "Invalid relationship") };
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const d = parsed.data;
  const isId = uuid.safeParse(d.related).success;
  const { data: related } = await supabase.from("memorials").select("id, slug").eq(isId ? "id" : "slug", d.related).maybeSingle();
  if (!related) return { ok: false, error: "We couldn't find that memorial. It may be private." };
  if (related.id === d.memorialId) return { ok: false, error: "A memorial cannot be connected to itself." };
  const { data: existing } = await supabase.from("family_relationships").select("id").eq("memorial_id", d.memorialId).eq("related_memorial_id", related.id).maybeSingle();
  if (existing) return { ok: false, error: "These memorials are already connected." };
  const { data, error } = await supabase
    .from("family_relationships")
    .insert({ memorial_id: d.memorialId, related_memorial_id: related.id, relationship_type: d.type, label: d.label || null, created_by: user.id })
    .select("*")
    .single();
  if (error) return { ok: false, error: errorMessage(error) };
  revalidateMemorial(slug);
  revalidatePath(`/memorial/${related.slug}`);
  return { ok: true, data };
}

export async function deleteFamilyRelationship(input: { id: string; slug?: string }): Promise<ActionResult> {
  const parsed = z.object({ id: uuid, slug: z.string().optional() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid relationship" };
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const { error } = await supabase.from("family_relationships").delete().eq("id", parsed.data.id);
  if (error) return { ok: false, error: errorMessage(error) };
  revalidateMemorial(parsed.data.slug);
  return { ok: true };
}

/* ---- Administrators ---------------------------------------------------- */

export type ProfileMatch = { id: string; display_name: string; avatar_path: string | null };

/** Find people to invite by display name, or paste a profile id. */
export async function searchProfiles(query: string): Promise<ActionResult<ProfileMatch[]>> {
  const q = z.string().trim().min(1).max(80).safeParse(query);
  if (!q.success) return { ok: true, data: [] };
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  if (uuid.safeParse(q.data).success) {
    const { data } = await supabase.from("profiles").select("id, display_name, avatar_path").eq("id", q.data).maybeSingle();
    return { ok: true, data: data ? [data] : [] };
  }
  const { data, error } = await supabase.from("profiles").select("id, display_name, avatar_path").ilike("display_name", `%${q.data.replace(/[%_]/g, "")}%`).neq("id", user.id).limit(8);
  if (error) return { ok: false, error: errorMessage(error) };
  return { ok: true, data: data ?? [] };
}

export type MemorialAdminWithProfile = MemorialAdmin & { profile: ProfileMatch | null };

export async function listMemorialAdmins(memorialId: string): Promise<ActionResult<MemorialAdminWithProfile[]>> {
  if (!uuid.safeParse(memorialId).success) return { ok: false, error: "Invalid memorial" };
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const { data, error } = await supabase.from("memorial_admins").select("*").eq("memorial_id", memorialId).order("created_at");
  if (error) return { ok: false, error: errorMessage(error) };
  const ids = Array.from(new Set((data ?? []).map((a) => a.user_id)));
  const profiles = ids.length ? ((await supabase.from("profiles").select("id, display_name, avatar_path").in("id", ids)).data ?? []) : [];
  const map = new Map(profiles.map((p) => [p.id, p]));
  return { ok: true, data: (data ?? []).map((a) => ({ ...a, profile: map.get(a.user_id) ?? null })) };
}

export async function addMemorialAdmin(memorialId: string, userIdOrName: string, role: "administrator" | "contributor", slug?: string): Promise<ActionResult<MemorialAdminWithProfile>> {
  const parsed = z.object({ memorialId: uuid, who: z.string().trim().min(1, "Choose a person"), role: z.enum(["administrator", "contributor"]) }).safeParse({ memorialId, who: userIdOrName, role });
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error, "Invalid administrator") };
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const d = parsed.data;

  let profile: ProfileMatch | null = null;
  if (uuid.safeParse(d.who).success) {
    profile = (await supabase.from("profiles").select("id, display_name, avatar_path").eq("id", d.who).maybeSingle()).data ?? null;
  } else {
    const { data: matches } = await supabase.from("profiles").select("id, display_name, avatar_path").ilike("display_name", d.who).limit(2);
    if ((matches?.length ?? 0) > 1) return { ok: false, error: "Several people share that name. Pick one from the search results or paste their profile id." };
    profile = matches?.[0] ?? null;
  }
  if (!profile) return { ok: false, error: "We couldn't find that person. Ask them to sign up first, or paste their profile id." };
  if (profile.id === user.id) return { ok: false, error: "You already own this memorial." };

  const { data: existing } = await supabase.from("memorial_admins").select("id").eq("memorial_id", d.memorialId).eq("user_id", profile.id).maybeSingle();
  if (existing) return { ok: false, error: `${profile.display_name} already helps manage this memorial.` };

  const { data, error } = await supabase
    .from("memorial_admins")
    .insert({ memorial_id: d.memorialId, user_id: profile.id, role: d.role, invited_by: user.id })
    .select("*")
    .single();
  if (error) return { ok: false, error: errorMessage(error) };
  revalidateMemorial(slug);
  return { ok: true, data: { ...data, profile } };
}

export async function removeMemorialAdmin(input: { id: string; slug?: string }): Promise<ActionResult> {
  const parsed = z.object({ id: uuid, slug: z.string().optional() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid administrator" };
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const { error } = await supabase.from("memorial_admins").delete().eq("id", parsed.data.id);
  if (error) return { ok: false, error: errorMessage(error) };
  revalidateMemorial(parsed.data.slug);
  return { ok: true };
}

/* ---- Family groups ------------------------------------------------------ */

function slugify(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "family";
}

export async function createFamilyGroup(name: string, description?: string | null): Promise<ActionResult<FamilyGroup>> {
  const parsed = z.object({ name: z.string().trim().min(2, "Give the family group a name").max(100), description: optionalText(1000) }).safeParse({ name, description });
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error, "Invalid family group") };
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Sign in to create a family group." };
  const suffix = Math.random().toString(36).slice(2, 7);
  const slug = `${slugify(parsed.data.name)}-${suffix}`;
  const { data: group, error } = await supabase
    .from("family_groups")
    .insert({ name: parsed.data.name, slug, description: parsed.data.description || null, owner_id: user.id, privacy: "public" })
    .select("*")
    .single();
  if (error) return { ok: false, error: errorMessage(error) };
  const { error: memberError } = await supabase.from("family_group_members").insert({ family_group_id: group.id, user_id: user.id, role: "owner" });
  if (memberError && !/duplicate|unique/i.test(memberError.message)) return { ok: false, error: errorMessage(memberError) };
  revalidatePath("/dashboard");
  return { ok: true, data: group };
}

export async function setMemorialFamilyGroup(memorialId: string, groupId: string | null, slug?: string): Promise<ActionResult> {
  const parsed = z.object({ memorialId: uuid, groupId: uuid.nullable() }).safeParse({ memorialId, groupId });
  if (!parsed.success) return { ok: false, error: "Invalid family group" };
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const { error } = await supabase.from("memorials").update({ family_group_id: parsed.data.groupId }).eq("id", parsed.data.memorialId);
  if (error) return { ok: false, error: errorMessage(error) };
  revalidateMemorial(slug);
  revalidatePath("/map");
  return { ok: true };
}

/** Family groups the current user owns or belongs to (for selects). */
export async function listMyFamilyGroups(): Promise<ActionResult<Pick<FamilyGroup, "id" | "name" | "slug">[]>> {
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const [{ data: owned }, { data: memberships }] = await Promise.all([
    supabase.from("family_groups").select("id, name, slug").eq("owner_id", user.id),
    supabase.from("family_group_members").select("family_group_id").eq("user_id", user.id),
  ]);
  const ownedIds = new Set((owned ?? []).map((g) => g.id));
  const extraIds = (memberships ?? []).map((m) => m.family_group_id).filter((id) => !ownedIds.has(id));
  const extra = extraIds.length ? ((await supabase.from("family_groups").select("id, name, slug").in("id", extraIds)).data ?? []) : [];
  const all = [...(owned ?? []), ...extra].sort((a, b) => a.name.localeCompare(b.name));
  return { ok: true, data: all };
}

/** Plan limits for the current user (null values mean unlimited). */
export async function getPlanLimits(): Promise<Record<string, unknown>> {
  const { supabase, user } = await getSessionUser();
  if (!user) return {};
  const { data } = await supabase.rpc("plan_limits", {});
  return (data as Record<string, unknown> | null) ?? {};
}
