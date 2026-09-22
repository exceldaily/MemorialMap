import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Stable anonymous visitor key stored in localStorage (for tribute rate limiting). */
export function getVisitorKey(): string {
  if (typeof window === "undefined") return "";
  try {
    const k = "mm_visitor_key";
    let v = window.localStorage.getItem(k);
    if (!v) {
      v = crypto.randomUUID().replace(/-/g, "");
      window.localStorage.setItem(k, v);
    }
    return v;
  } catch {
    return "anon-" + Math.random().toString(36).slice(2, 14) + Date.now().toString(36);
  }
}

export function errorMessage(e: unknown, fallback = "Something went wrong. Please try again.") {
  if (!e) return fallback;
  if (typeof e === "string") return e;
  if (typeof e === "object" && e && "message" in e && typeof (e as { message: unknown }).message === "string") {
    return (e as { message: string }).message;
  }
  return fallback;
}
