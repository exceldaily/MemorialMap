import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./types";
import { env } from "@/lib/env";

/**
 * Server-side Supabase client bound to the current user's session cookies.
 * Use in Server Components, Server Actions and Route Handlers.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient<Database, "memorial">(env.supabaseUrl, env.supabaseAnonKey, {
    db: { schema: "memorial" },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component; the middleware refreshes sessions instead.
        }
      },
    },
  });
}

/**
 * Service-role client. SERVER ONLY. Never import from client components.
 * Used for privileged work such as Open Graph rendering of unlisted memorials
 * and administrative maintenance. Returns null when the key is not configured.
 */
export function createSupabaseAdminClient() {
  if (!env.supabaseServiceRoleKey) return null;
  return createClient<Database, "memorial">(env.supabaseUrl, env.supabaseServiceRoleKey, {
    db: { schema: "memorial" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Returns the current user's memorial profile, creating it on first sign-in. */
export async function getCurrentProfile() {
  const { supabase, user } = await getSessionUser();
  if (!user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase.rpc("ensure_profile");
  return { supabase, user, profile: profile ?? null };
}
