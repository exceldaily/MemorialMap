import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { FamilyOfRow, Memorial, MemorialLocation, MemorialPhoto, MemorialVideo, Memory, TimelineEvent, MemorialRole, FamilyGroup } from "@/lib/supabase/types";

export type MemorialBundle = {
  memorial: Memorial;
  location: MemorialLocation | null;
  photos: MemorialPhoto[];
  videos: MemorialVideo[];
  timeline: TimelineEvent[];
  memories: (Memory & { author?: { display_name: string; avatar_path: string | null } | null })[];
  family: FamilyOfRow[];
  familyGroup: FamilyGroup | null;
  tributeCounts: Record<string, number>;
  viewerRole: MemorialRole | null;
  isSaved: boolean;
  viewerId: string | null;
};

/**
 * Loads everything a memorial page needs in one pass. RLS decides visibility:
 * unlisted memorials load for anyone with the link, private ones only for
 * owners/admins/contributors.
 */
export const getMemorialBySlug = cache(async (slug: string): Promise<MemorialBundle | null> => {
  const supabase = await createSupabaseServerClient();
  const { data: memorial } = await supabase.from("memorials").select("*").eq("slug", slug).maybeSingle();
  if (!memorial) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [loc, photos, videos, timeline, memories, family, counts, role, saved, group] = await Promise.all([
    supabase.from("memorial_locations").select("*").eq("memorial_id", memorial.id).maybeSingle(),
    supabase.from("memorial_photos").select("*").eq("memorial_id", memorial.id).order("sort_order").order("created_at"),
    supabase.from("memorial_videos").select("*").eq("memorial_id", memorial.id).order("sort_order"),
    supabase.from("timeline_events").select("*").eq("memorial_id", memorial.id).order("year").order("sort_order"),
    supabase.from("memories").select("*").eq("memorial_id", memorial.id).order("created_at", { ascending: false }).limit(200),
    supabase.rpc("family_of", { p_memorial_id: memorial.id }),
    supabase.rpc("tribute_counts", { p_memorial_id: memorial.id }),
    user ? supabase.rpc("role_for", { p_memorial_id: memorial.id }) : Promise.resolve({ data: null }),
    user ? supabase.from("saved_memorials").select("memorial_id").eq("user_id", user.id).eq("memorial_id", memorial.id).maybeSingle() : Promise.resolve({ data: null }),
    memorial.family_group_id ? supabase.from("family_groups").select("*").eq("id", memorial.family_group_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  // Attach author display names to memories (profiles are publicly readable).
  const memoryRows = memories.data ?? [];
  const authorIds = Array.from(new Set(memoryRows.map((m) => m.author_id)));
  const authors = authorIds.length ? (await supabase.from("profiles").select("id, display_name, avatar_path").in("id", authorIds)).data ?? [] : [];
  const authorMap = new Map(authors.map((a) => [a.id, a]));

  return {
    memorial,
    location: loc.data ?? null,
    photos: photos.data ?? [],
    videos: videos.data ?? [],
    timeline: timeline.data ?? [],
    memories: memoryRows.map((m) => ({ ...m, author: authorMap.get(m.author_id) ?? null })),
    family: (family.data ?? []).filter((f) => f.status === "published"),
    familyGroup: group.data ?? null,
    tributeCounts: (counts.data as Record<string, number> | null) ?? {},
    viewerRole: (role.data as MemorialRole | null) ?? null,
    isSaved: Boolean(saved.data),
    viewerId: user?.id ?? null,
  };
});

export const canManageRole = (role: MemorialRole | null) => role === "owner" || role === "administrator";
export const canContributeRole = (role: MemorialRole | null) => role === "owner" || role === "administrator" || role === "contributor";
