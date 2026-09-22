import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** GET /api/search?q=&birth=&death=&limit=&offset= — public memorial search. */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const q = sp.get("q")?.trim() || null;
  const birth = sp.get("birth") ? Number(sp.get("birth")) : null;
  const death = sp.get("death") ? Number(sp.get("death")) : null;
  const limit = Math.min(Math.max(Number(sp.get("limit") ?? 30), 1), 100);
  const offset = Math.max(Number(sp.get("offset") ?? 0), 0);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("search_memorials", {
    p_query: q,
    p_birth_year: Number.isFinite(birth) ? birth : null,
    p_death_year: Number.isFinite(death) ? death : null,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ results: data ?? [] }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
}
