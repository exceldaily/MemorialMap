export type Bucket =
  | "memorial-avatars"
  | "memorial-profile-images"
  | "memorial-cover-images"
  | "memorial-gallery"
  | "memorial-memory-photos"
  | "memorial-videos"
  | "memorial-audio";

const BASE = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
/** Supabase image transformation is a paid feature; opt in with NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORMS=true. */
const TRANSFORMS = process.env.NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORMS === "true";

/**
 * Public URL for an object in one of the memorial buckets.
 * Stored paths are `<bucket>/<userId>/<file>`; we also accept a bare object path
 * when the bucket is given explicitly.
 */
export function publicUrl(path: string | null | undefined, bucket?: Bucket): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  const clean = path.replace(/^\/+/, "");
  const full = bucket && !clean.startsWith(bucket + "/") ? `${bucket}/${clean}` : clean;
  return `${BASE}/storage/v1/object/public/${full}`;
}

/** Render URL with transformations (Supabase image transformation, when available on the plan). */
export function imageUrl(path: string | null | undefined, opts?: { width?: number; height?: number; quality?: number }, bucket?: Bucket) {
  const url = publicUrl(path, bucket);
  if (!url || !opts || !TRANSFORMS) return url;
  const params = new URLSearchParams();
  if (opts.width) params.set("width", String(opts.width));
  if (opts.height) params.set("height", String(opts.height));
  if (opts.quality) params.set("quality", String(opts.quality));
  return url.replace("/object/public/", "/render/image/public/") + "?" + params.toString();
}

export const UPLOAD_LIMITS: Record<Bucket, { maxBytes: number; mimes: string[] }> = {
  "memorial-avatars": { maxBytes: 2 * 1024 * 1024, mimes: ["image/jpeg", "image/png", "image/webp"] },
  "memorial-profile-images": { maxBytes: 8 * 1024 * 1024, mimes: ["image/jpeg", "image/png", "image/webp"] },
  "memorial-cover-images": { maxBytes: 12 * 1024 * 1024, mimes: ["image/jpeg", "image/png", "image/webp"] },
  "memorial-gallery": { maxBytes: 12 * 1024 * 1024, mimes: ["image/jpeg", "image/png", "image/webp"] },
  "memorial-memory-photos": { maxBytes: 8 * 1024 * 1024, mimes: ["image/jpeg", "image/png", "image/webp"] },
  "memorial-videos": { maxBytes: 200 * 1024 * 1024, mimes: ["video/mp4", "video/webm", "video/quicktime"] },
  "memorial-audio": { maxBytes: 20 * 1024 * 1024, mimes: ["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/ogg", "audio/wav", "audio/webm"] },
};
