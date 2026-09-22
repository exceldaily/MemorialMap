"use client";

/**
 * Client-side image preparation: resizes large images to a maximum edge and
 * re-encodes as JPEG/WebP so uploads stay small. Falls back to the original
 * file if the browser cannot decode it.
 */
export async function prepareImage(
  file: File,
  opts: { maxEdge?: number; quality?: number; mime?: "image/jpeg" | "image/webp" } = {},
): Promise<{ file: File; width: number; height: number }> {
  const { maxEdge = 2000, quality = 0.86, mime = "image/jpeg" } = opts;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    if (scale === 1 && file.size < 1.5 * 1024 * 1024 && file.type !== "image/png") {
      return { file, width, height };
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { file, width, height };
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
    if (!blob) return { file, width, height };
    const ext = mime === "image/webp" ? "webp" : "jpg";
    const name = file.name.replace(/\.[^.]+$/, "") + "." + ext;
    return { file: new File([blob], name, { type: mime }), width, height };
  } catch {
    return { file, width: 0, height: 0 };
  }
}

export function fileExtension(file: File) {
  const byType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  };
  return byType[file.type] ?? (file.name.split(".").pop() || "bin").toLowerCase();
}
