import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";

const PROTECTED_PREFIXES = ["/dashboard", "/create", "/saved", "/account", "/admin", "/family/new"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient<Database, "memorial">(url, key, {
    db: { schema: "memorial" },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/")) || /^\/memorial\/[^/]+\/(edit|manage)/.test(pathname);
  if (!user && isProtected) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/auth/sign-in";
    redirect.searchParams.set("next", pathname + search);
    return NextResponse.redirect(redirect);
  }
  return response;
}
