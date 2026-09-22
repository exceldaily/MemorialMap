import { ImageResponse } from "next/og";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { publicUrl } from "@/lib/storage";
import { SITE_NAME } from "@/lib/site";

export const alt = "Memorial";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#0b1220";
const GOLD = "#d3b877";
const IVORY = "#f4efe4";
const MUTED = "#b8ad97";

function years(birth: number | null, death: number | null, type: string) {
  if (type === "living") return birth ? `Born ${birth}` : "";
  if (birth && death) return `${birth} – ${death}`;
  if (birth) return `${birth} –`;
  if (death) return `– ${death}`;
  return "";
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: `radial-gradient(90% 70% at 50% 120%, rgba(211,184,119,0.22) 0%, transparent 60%), linear-gradient(180deg, #111a2c 0%, ${NAVY} 100%)`,
        color: IVORY,
        fontFamily: "Georgia, 'Times New Roman', serif",
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />
      {children}
    </div>
  );
}

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let memorial: { full_name: string; birth_year: number | null; death_year: number | null; epitaph: string; profile_image_path: string | null; memorial_type: string } | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("memorials")
      .select("full_name, birth_year, death_year, epitaph, profile_image_path, memorial_type, status")
      .eq("slug", slug)
      .maybeSingle();
    if (data && data.status !== "removed" && data.status !== "suspended") memorial = data;
  } catch {
    memorial = null;
  }

  if (!memorial) {
    return new ImageResponse(
      (
        <Frame>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 80, textAlign: "center" }}>
            <div style={{ fontSize: 72, letterSpacing: -1 }}>{SITE_NAME}</div>
            <div style={{ marginTop: 20, fontSize: 30, color: MUTED, fontStyle: "italic" }}>Every life deserves a place to be remembered.</div>
          </div>
        </Frame>
      ),
      size,
    );
  }

  const img = publicUrl(memorial.profile_image_path);
  const yrs = years(memorial.birth_year, memorial.death_year, memorial.memorial_type);
  const epitaph = memorial.epitaph?.length > 140 ? memorial.epitaph.slice(0, 139).trimEnd() + "…" : memorial.epitaph;
  const nameSize = memorial.full_name.length > 28 ? 58 : memorial.full_name.length > 20 ? 68 : 80;

  return new ImageResponse(
    (
      <Frame>
        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "60px 80px", gap: 56 }}>
          {img ? (
            <img src={img} alt="" width={260} height={260} style={{ width: 260, height: 260, borderRadius: 999, objectFit: "cover", border: `5px solid ${GOLD}`, flexShrink: 0 }} />
          ) : (
            <div
              style={{
                width: 260,
                height: 260,
                borderRadius: 999,
                border: `5px solid ${GOLD}`,
                background: "#1a2538",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 96,
                color: MUTED,
                flexShrink: 0,
              }}
            >
              {memorial.full_name
                .split(/\s+/)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase())
                .join("")}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 22, letterSpacing: 6, textTransform: "uppercase", color: GOLD, fontFamily: "Arial, Helvetica, sans-serif" }}>{memorial.memorial_type === "living" ? "A life celebrated" : "In loving memory"}</div>
            <div style={{ marginTop: 14, fontSize: nameSize, lineHeight: 1.05, color: IVORY }}>{memorial.full_name}</div>
            {yrs && <div style={{ marginTop: 14, fontSize: 36, color: GOLD, letterSpacing: 2 }}>{yrs}</div>}
            {epitaph && <div style={{ marginTop: 26, fontSize: 30, lineHeight: 1.3, color: "#e8e0cf", fontStyle: "italic" }}>“{epitaph}”</div>}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 80px 40px", fontFamily: "Arial, Helvetica, sans-serif" }}>
          <div style={{ fontSize: 26, color: MUTED }}>{SITE_NAME}</div>
          <div style={{ fontSize: 18, color: "#948a76", letterSpacing: 3, textTransform: "uppercase" }}>Digital memorial</div>
        </div>
      </Frame>
    ),
    size,
  );
}
