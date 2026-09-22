"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { prepareImage, fileExtension } from "@/lib/images";
import { UPLOAD_LIMITS, type Bucket } from "@/lib/storage";

export type UploadResult = { path: string; width: number; height: number; bytes: number };

/**
 * Uploads a file to a memorial bucket. Objects live under `<userId>/…` so the
 * storage policies can verify ownership. Images are resized client-side first.
 * Returns the bucket-qualified path (`bucket/userId/file`) to store in the DB.
 */
export async function uploadToBucket(bucket: Bucket, file: File, opts: { maxEdge?: number; onProgress?: (pct: number) => void } = {}): Promise<UploadResult> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to upload.");
  const limits = UPLOAD_LIMITS[bucket];
  if (!limits.mimes.includes(file.type)) throw new Error(`Unsupported file type. Allowed: ${limits.mimes.map((m) => m.split("/")[1]).join(", ")}.`);

  let toUpload = file;
  let width = 0;
  let height = 0;
  if (file.type.startsWith("image/")) {
    const prepared = await prepareImage(file, { maxEdge: opts.maxEdge ?? 2000 });
    toUpload = prepared.file;
    width = prepared.width;
    height = prepared.height;
  }
  if (toUpload.size > limits.maxBytes) {
    throw new Error(`That file is too large. Maximum size is ${Math.round(limits.maxBytes / 1024 / 1024)} MB.`);
  }
  const objectPath = `${user.id}/${crypto.randomUUID()}.${fileExtension(toUpload)}`;
  opts.onProgress?.(10);
  const { error } = await supabase.storage.from(bucket).upload(objectPath, toUpload, { contentType: toUpload.type, upsert: false, cacheControl: "31536000" });
  if (error) throw new Error(error.message);
  opts.onProgress?.(100);
  return { path: `${bucket}/${objectPath}`, width, height, bytes: toUpload.size };
}

export async function removeFromBucket(path: string) {
  const supabase = createSupabaseBrowserClient();
  const [bucket, ...rest] = path.split("/");
  if (!bucket || rest.length === 0) return;
  await supabase.storage.from(bucket).remove([rest.join("/")]);
}
