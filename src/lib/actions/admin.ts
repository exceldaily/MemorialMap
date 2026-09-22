"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionUser } from "@/lib/supabase/server";
import type { Json, MemorialStatus, ModerationStatus, ReportStatus } from "@/lib/supabase/types";
import { errorMessage } from "@/lib/utils";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const uuid = z.string().uuid("Invalid identifier");
const reason = z.string().trim().max(500, "Keep the reason under 500 characters").optional().or(z.literal(""));

type AdminContext = { supabase: Awaited<ReturnType<typeof getSessionUser>>["supabase"]; user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>["user"]> };

/** Resolves the admin's client, or an error when the caller is not an administrator. */
async function requireAdmin(): Promise<{ error: string; supabase?: undefined; user?: undefined } | ({ error?: undefined } & AdminContext)> {
  const { supabase, user } = await getSessionUser();
  if (!user) return { error: "Not signed in" };
  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) return { error: "Administrator access is required." };
  return { supabase, user };
}

function revalidateAdmin(extra: string[] = []) {
  revalidatePath("/admin", "layout");
  for (const p of extra) revalidatePath(p);
}

/* ---- Memorials ---------------------------------------------------------- */

export async function adminSetMemorialStatus(input: { id: string; slug?: string; status: MemorialStatus; reason?: string }): Promise<ActionResult> {
  const parsed = z.object({ id: uuid, slug: z.string().optional(), status: z.enum(["draft", "published", "suspended", "removed"]), reason }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" };
  const ctx = await requireAdmin();
  if (ctx.error !== undefined) return { ok: false, error: ctx.error };
  const { error } = await ctx.supabase.rpc("admin_set_memorial_status", {
    p_memorial_id: parsed.data.id,
    p_status: parsed.data.status,
    p_reason: parsed.data.reason || null,
  });
  if (error) return { ok: false, error: errorMessage(error) };
  revalidateAdmin(["/map", "/search", ...(parsed.data.slug ? [`/memorial/${parsed.data.slug}`] : [])]);
  return { ok: true };
}

/* ---- Reports ------------------------------------------------------------ */

export async function adminResolveReport(input: { id: string; status: ReportStatus; note?: string }): Promise<ActionResult> {
  const parsed = z.object({ id: uuid, status: z.enum(["open", "reviewing", "resolved", "dismissed"]), note: reason }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" };
  const ctx = await requireAdmin();
  if (ctx.error !== undefined) return { ok: false, error: ctx.error };
  const { error } = await ctx.supabase.rpc("admin_resolve_report", { p_report_id: parsed.data.id, p_status: parsed.data.status, p_note: parsed.data.note || null });
  if (error) return { ok: false, error: errorMessage(error) };
  revalidateAdmin();
  return { ok: true };
}

/* ---- Users -------------------------------------------------------------- */

export async function adminSetUserBlocked(input: { userId: string; blocked: boolean; reason?: string }): Promise<ActionResult> {
  const parsed = z.object({ userId: uuid, blocked: z.boolean(), reason }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid request" };
  const ctx = await requireAdmin();
  if (ctx.error !== undefined) return { ok: false, error: ctx.error };
  if (parsed.data.userId === ctx.user.id && parsed.data.blocked) return { ok: false, error: "You cannot block your own account." };
  const { error } = await ctx.supabase.rpc("admin_set_user_blocked", { p_user_id: parsed.data.userId, p_blocked: parsed.data.blocked, p_reason: parsed.data.reason || null });
  if (error) return { ok: false, error: errorMessage(error) };
  revalidateAdmin();
  return { ok: true };
}

export async function adminSetUserAdmin(input: { userId: string; isAdmin: boolean }): Promise<ActionResult> {
  const parsed = z.object({ userId: uuid, isAdmin: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request" };
  const ctx = await requireAdmin();
  if (ctx.error !== undefined) return { ok: false, error: ctx.error };
  if (parsed.data.userId === ctx.user.id && !parsed.data.isAdmin) return { ok: false, error: "You cannot remove your own administrator access." };
  const { error, count } = await ctx.supabase.from("profiles").update({ is_admin: parsed.data.isAdmin }, { count: "exact" }).eq("id", parsed.data.userId);
  if (error) return { ok: false, error: errorMessage(error) };
  if (count === 0) return { ok: false, error: "The profile could not be updated. Check that administrators are allowed to edit profiles." };
  await ctx.supabase.rpc("log_activity", {
    p_action: parsed.data.isAdmin ? "admin.grant_admin" : "admin.revoke_admin",
    p_entity_type: "profile",
    p_entity_id: parsed.data.userId,
    p_metadata: {},
  });
  revalidateAdmin();
  return { ok: true };
}

/* ---- Photos ------------------------------------------------------------- */

export async function adminSetPhotoStatus(input: { id: string; slug?: string; status: ModerationStatus }): Promise<ActionResult> {
  const parsed = z.object({ id: uuid, slug: z.string().optional(), status: z.enum(["approved", "hidden"]) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request" };
  const ctx = await requireAdmin();
  if (ctx.error !== undefined) return { ok: false, error: ctx.error };
  const { error, count } = await ctx.supabase.from("memorial_photos").update({ status: parsed.data.status }, { count: "exact" }).eq("id", parsed.data.id);
  if (error) return { ok: false, error: errorMessage(error) };
  if (count === 0) return { ok: false, error: "The photo could not be updated — the current policies may not allow administrators to moderate this photo directly." };
  await ctx.supabase.rpc("log_activity", { p_action: `admin.photo_${parsed.data.status}`, p_entity_type: "memorial_photo", p_entity_id: parsed.data.id, p_metadata: {} });
  revalidateAdmin(parsed.data.slug ? [`/memorial/${parsed.data.slug}`] : []);
  return { ok: true };
}

export async function adminDeletePhoto(input: { id: string; slug?: string }): Promise<ActionResult> {
  const parsed = z.object({ id: uuid, slug: z.string().optional() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request" };
  const ctx = await requireAdmin();
  if (ctx.error !== undefined) return { ok: false, error: ctx.error };
  const { error, count } = await ctx.supabase.from("memorial_photos").delete({ count: "exact" }).eq("id", parsed.data.id);
  if (error) return { ok: false, error: errorMessage(error) };
  if (count === 0) return { ok: false, error: "The photo could not be deleted — the current policies may not allow administrators to remove this photo directly." };
  await ctx.supabase.rpc("log_activity", { p_action: "admin.photo_deleted", p_entity_type: "memorial_photo", p_entity_id: parsed.data.id, p_metadata: {} });
  revalidateAdmin(parsed.data.slug ? [`/memorial/${parsed.data.slug}`] : []);
  return { ok: true };
}

/* ---- Blocked geographic areas ------------------------------------------- */

export async function adminBlockArea(input: { name: string; reason?: string; latitude: number; longitude: number; radiusMeters: number }): Promise<ActionResult<{ id: string }>> {
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Give the area a name").max(120),
      reason,
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      radiusMeters: z.number().min(10, "Radius must be at least 10 m").max(2_000_000, "Radius is too large"),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid area" };
  const ctx = await requireAdmin();
  if (ctx.error !== undefined) return { ok: false, error: ctx.error };
  const { data, error } = await ctx.supabase.rpc("admin_block_area", {
    p_name: parsed.data.name,
    p_reason: parsed.data.reason || null,
    p_latitude: parsed.data.latitude,
    p_longitude: parsed.data.longitude,
    p_radius_meters: parsed.data.radiusMeters,
  });
  if (error) return { ok: false, error: errorMessage(error) };
  revalidateAdmin();
  return { ok: true, data: { id: data } };
}

export async function adminBlockPolygon(input: { name: string; reason?: string; geojson: string }): Promise<ActionResult<{ id: string }>> {
  const parsed = z.object({ name: z.string().trim().min(2, "Give the area a name").max(120), reason, geojson: z.string().trim().min(2, "Paste a GeoJSON polygon") }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid area" };
  let geometry: Json;
  try {
    const raw = JSON.parse(parsed.data.geojson) as { type?: string; geometry?: { type?: string } };
    const geom = raw.type === "Feature" && raw.geometry ? raw.geometry : raw;
    if (geom.type !== "Polygon" && geom.type !== "MultiPolygon") return { ok: false, error: "The GeoJSON must be a Polygon or MultiPolygon geometry (or a Feature containing one)." };
    geometry = geom as Json;
  } catch {
    return { ok: false, error: "That is not valid JSON." };
  }
  const ctx = await requireAdmin();
  if (ctx.error !== undefined) return { ok: false, error: ctx.error };
  const { data, error } = await ctx.supabase.rpc("admin_block_polygon", { p_name: parsed.data.name, p_reason: parsed.data.reason || null, p_geojson: geometry });
  if (error) return { ok: false, error: errorMessage(error) };
  revalidateAdmin();
  return { ok: true, data: { id: data } };
}

export async function adminSetAreaActive(input: { id: string; active: boolean }): Promise<ActionResult> {
  const parsed = z.object({ id: uuid, active: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request" };
  const ctx = await requireAdmin();
  if (ctx.error !== undefined) return { ok: false, error: ctx.error };
  const { error, count } = await ctx.supabase.from("blocked_geographic_areas").update({ is_active: parsed.data.active }, { count: "exact" }).eq("id", parsed.data.id);
  if (error) return { ok: false, error: errorMessage(error) };
  if (count === 0) return { ok: false, error: "The area could not be updated." };
  await ctx.supabase.rpc("log_activity", {
    p_action: parsed.data.active ? "admin.area_activated" : "admin.area_deactivated",
    p_entity_type: "blocked_geographic_area",
    p_entity_id: parsed.data.id,
    p_metadata: {},
  });
  revalidateAdmin();
  return { ok: true };
}
