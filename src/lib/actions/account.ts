"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionUser } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";
import { errorMessage } from "@/lib/utils";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const profileSchema = z.object({
  display_name: z.string().trim().min(2, "Your name needs at least 2 characters").max(80, "Names are limited to 80 characters"),
  bio: z.string().trim().max(600, "Your bio is limited to 600 characters").optional().or(z.literal("")),
  avatar_path: z
    .string()
    .trim()
    .max(400)
    .regex(/^memorial-avatars\/[^/]+\/[^/]+$/, "Invalid avatar")
    .nullable()
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof profileSchema>;

/** Updates the signed-in user's public profile (name, bio, avatar). */
export async function updateProfile(input: UpdateProfileInput): Promise<ActionResult<Profile>> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid profile" };
  const { supabase, user } = await getSessionUser();
  if (!user) return { ok: false, error: "Sign in to update your profile." };

  // Make sure the profile row exists before updating it (first sign-in edge case).
  await supabase.rpc("ensure_profile");

  const update: Partial<Profile> = {
    display_name: parsed.data.display_name,
    bio: parsed.data.bio || null,
  };
  if (parsed.data.avatar_path !== undefined) update.avatar_path = parsed.data.avatar_path;

  const { data, error } = await supabase.from("profiles").update(update).eq("id", user.id).select("*").single();
  if (error) return { ok: false, error: errorMessage(error) };
  revalidatePath("/account");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  return { ok: true, data };
}
