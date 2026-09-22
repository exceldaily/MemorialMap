import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { env } from "@/lib/env";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

const STATIC: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/map", priority: 0.9, changeFrequency: "daily" },
  { path: "/search", priority: 0.6, changeFrequency: "weekly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/pricing", priority: 0.4, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC.map((s) => ({ url: `${SITE_URL}${s.path}`, priority: s.priority, changeFrequency: s.changeFrequency }));
  try {
    // Anonymous client: the sitemap is cached and must not depend on request cookies.
    if (!env.supabaseUrl || !env.supabaseAnonKey) return entries;
    const supabase = createClient<Database, "memorial">(env.supabaseUrl, env.supabaseAnonKey, { db: { schema: "memorial" }, auth: { persistSession: false } });
    const { data } = await supabase
      .from("memorials")
      .select("slug, updated_at")
      .eq("status", "published")
      .eq("privacy", "public")
      .order("updated_at", { ascending: false })
      .limit(5000);
    for (const m of data ?? []) {
      entries.push({ url: `${SITE_URL}/memorial/${m.slug}`, lastModified: m.updated_at, changeFrequency: "weekly", priority: 0.7 });
    }
  } catch {
    /* fall back to static routes only */
  }
  return entries;
}
