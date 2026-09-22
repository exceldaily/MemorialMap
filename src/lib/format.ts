import type { Memorial } from "./supabase/types";

/** "1948 – 2025", "1948 – ", "– 2025", or "" when both are unknown. */
export function lifeYears(birth: number | null | undefined, death: number | null | undefined, type?: string) {
  if (type === "living") return birth ? `Born ${birth}` : "";
  if (birth && death) return `${birth} – ${death}`;
  if (birth) return `${birth} – `;
  if (death) return `– ${death}`;
  return "";
}

export function fullName(m: Pick<Memorial, "first_name" | "middle_name" | "last_name">) {
  return [m.first_name, m.middle_name, m.last_name].filter(Boolean).join(" ");
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function formatDate(iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" }) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { timeZone: "UTC", ...opts });
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export function truncate(text: string | null | undefined, n = 160) {
  if (!text) return "";
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
}

export function formatCoord(n: number, axis: "lat" | "lng") {
  const dir = axis === "lat" ? (n >= 0 ? "N" : "S") : n >= 0 ? "E" : "W";
  return `${Math.abs(n).toFixed(5)}° ${dir}`;
}

export function compactNumber(n: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}
