import { publicUrl } from "@/lib/storage";
import type { MemorialVideo } from "@/lib/supabase/types";
import { SectionHeading } from "./SectionHeading";

/** Converts YouTube / Vimeo page URLs to embeddable player URLs. Returns null for unsupported hosts. */
export function toEmbedUrl(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, "");
  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/);
    return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
  }
  if (host === "vimeo.com") {
    const m = u.pathname.match(/\/(\d+)/);
    return m ? `https://player.vimeo.com/video/${m[1]}` : null;
  }
  if (host === "player.vimeo.com") return raw;
  return null;
}

export function VideoSection({ videos, name }: { videos: MemorialVideo[]; name: string }) {
  const playable = videos.filter((v) => v.storage_path || (v.external_url && toEmbedUrl(v.external_url)));
  if (playable.length === 0) return null;

  return (
    <section id="videos" aria-labelledby="videos-heading" className="scroll-mt-32">
      <SectionHeading id="videos-heading" eyebrow="Moving pictures" title="Videos" />
      <ul className={playable.length === 1 ? "grid gap-6" : "grid gap-6 md:grid-cols-2"}>
        {playable.map((v) => {
          const title = v.title || `Video of ${name}`;
          const embed = v.external_url ? toEmbedUrl(v.external_url) : null;
          const file = v.storage_path ? publicUrl(v.storage_path) : null;
          return (
            <li key={v.id} className="card overflow-hidden">
              <div className="relative aspect-video w-full bg-navy-950">
                {file ? (
                  <video controls preload="metadata" className="h-full w-full" aria-label={title}>
                    <source src={file} />
                    Your browser does not support embedded video.
                  </video>
                ) : (
                  embed && (
                    <iframe
                      src={embed}
                      title={title}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                      className="absolute inset-0 h-full w-full border-0"
                    />
                  )
                )}
              </div>
              {(v.title || v.description) && (
                <div className="p-4">
                  {v.title && <p className="font-display text-lg text-ivory-50">{v.title}</p>}
                  {v.description && <p className="mt-1 text-sm text-ivory-400">{v.description}</p>}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
