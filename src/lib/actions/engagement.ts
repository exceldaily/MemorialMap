"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient, getSessionUser } from "@/lib/supabase/server";
import type { ModerationStatus, ReportReason, TributeType } from "@/lib/supabase/types";
import { errorMessage } from "@/lib/utils";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

/* ---- Memories ---------------------------------------------------------- */

const memorySchema = z.object({
  memorial_id: z.string().uuid(),
  slug: z.string().min(1),
  relationship: z.string().trim().max(80).optional().or(z.literal("")),
  body: z.string().trim().min(1, "Write a memory to share").max(5000, "Memories are limited to 5,000 characters"),
  photo_path: z.string().trim().max(400).optional().or(z.literal("")),
});

export async function submitMemory(input: z.infer<typeof memorySchema>): Promise<ActionResult<{ id: string }>> {
  const parsed = memorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid memory" };
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Sign in to share a memory." };
  const { data, error } = await supabase
    .from("memories")
    .insert({
      memorial_id: parsed.data.memorial_id,
      author_id: user.id,
      relationship: parsed.data.relationship || null,
      body: parsed.data.body,
      photo_path: parsed.data.photo_path || null,
      status: "pending",
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: errorMessage(error) };
  revalidatePath(`/memorial/${parsed.data.slug}`);
  return { ok: true, data: { id: data.id } };
}

export async function moderateMemory(input: { id: string; slug?: string; status: ModerationStatus }): Promise<ActionResult> {
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  if (!["approved", "hidden", "deleted"].includes(input.status)) return { ok: false, error: "Invalid status" };
  const { error } = await supabase
    .from("memories")
    .update({ status: input.status, moderated_by: user.id, moderated_at: new Date().toISOString() })
    .eq("id", input.id);
  if (error) return { ok: false, error: errorMessage(error) };
  if (input.slug) revalidatePath(`/memorial/${input.slug}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteMemory(input: { id: string; slug?: string }): Promise<ActionResult> {
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Not signed in" };
  const { error } = await supabase.from("memories").delete().eq("id", input.id);
  if (error) return { ok: false, error: errorMessage(error) };
  if (input.slug) revalidatePath(`/memorial/${input.slug}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

/* ---- Tributes ---------------------------------------------------------- */

export async function addTribute(input: { memorial_id: string; type: TributeType; visitor_key?: string }): Promise<ActionResult<{ added: boolean; counts: Record<string, number> }>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("add_tribute", {
    p_memorial_id: input.memorial_id,
    p_type: input.type,
    p_visitor_key: input.visitor_key ?? null,
  });
  if (error) return { ok: false, error: errorMessage(error) };
  return { ok: true, data };
}

/* ---- Saved memorials ---------------------------------------------------- */

export async function toggleSaved(input: { memorial_id: string; slug?: string }): Promise<ActionResult<{ saved: boolean }>> {
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Sign in to save memorials." };
  const { data: existing } = await supabase.from("saved_memorials").select("memorial_id").eq("user_id", user.id).eq("memorial_id", input.memorial_id).maybeSingle();
  if (existing) {
    const { error } = await supabase.from("saved_memorials").delete().eq("user_id", user.id).eq("memorial_id", input.memorial_id);
    if (error) return { ok: false, error: errorMessage(error) };
    revalidatePath("/saved");
    return { ok: true, data: { saved: false } };
  }
  const { error } = await supabase.from("saved_memorials").insert({ user_id: user.id, memorial_id: input.memorial_id });
  if (error) return { ok: false, error: errorMessage(error) };
  revalidatePath("/saved");
  return { ok: true, data: { saved: true } };
}

/* ---- Reports ------------------------------------------------------------ */

const reportSchema = z.object({
  memorial_id: z.string().uuid().optional(),
  memory_id: z.string().uuid().optional(),
  photo_id: z.string().uuid().optional(),
  reason: z.enum(["spam", "impersonation", "harassment", "inappropriate_content", "incorrect_information", "copyright", "privacy", "other"]),
  details: z.string().trim().max(2000).optional().or(z.literal("")),
  reporter_email: z.string().trim().email().optional().or(z.literal("")),
});

export async function submitReport(input: z.infer<typeof reportSchema>): Promise<ActionResult> {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid report" };
  if (!parsed.data.memorial_id && !parsed.data.memory_id && !parsed.data.photo_id) return { ok: false, error: "Nothing to report" };
  const { supabase, user } = await getSessionUser();
  const { error } = await supabase.from("reports").insert({
    memorial_id: parsed.data.memorial_id ?? null,
    memory_id: parsed.data.memory_id ?? null,
    photo_id: parsed.data.photo_id ?? null,
    reporter_id: user?.id ?? null,
    reporter_email: user ? null : parsed.data.reporter_email || null,
    reason: parsed.data.reason as ReportReason,
    details: parsed.data.details || null,
    status: "open",
  });
  if (error) return { ok: false, error: errorMessage(error) };
  return { ok: true };
}

/* ---- Views -------------------------------------------------------------- */

export async function recordView(slug: string) {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.rpc("increment_view", { p_slug: slug });
  } catch {
    /* non-critical */
  }
}
