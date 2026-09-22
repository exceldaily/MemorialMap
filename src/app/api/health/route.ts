import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, isMapboxConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Health endpoint consumed by OrbitStack probes. */
export async function GET() {
  const started = Date.now();
  let database: "ok" | "error" | "unconfigured" = "unconfigured";
  if (isSupabaseConfigured) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.from("settings").select("key").limit(1);
      database = error ? "error" : "ok";
    } catch {
      database = "error";
    }
  }
  const ok = database === "ok";
  return NextResponse.json(
    {
      status: ok ? "healthy" : database === "unconfigured" ? "degraded" : "offline",
      app: "memorial-map",
      checks: { database, mapbox: isMapboxConfigured ? "configured" : "missing" },
      latency_ms: Date.now() - started,
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
