import Image from "next/image";
import { imageUrl } from "@/lib/storage";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Avatar({
  path,
  name,
  size = 48,
  className,
  priority,
}: {
  path: string | null | undefined;
  name: string;
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  const src = imageUrl(path, { width: size * 2, height: size * 2, quality: 80 });
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy-700 ring-2 ring-gold-400/40 font-display text-ivory-200",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(12, size * 0.38) }}
      aria-hidden={!src}
    >
      {src ? (
        <Image src={src} alt={`Portrait of ${name}`} fill sizes={`${size}px`} className="object-cover" priority={priority} unoptimized />
      ) : (
        initials(name)
      )}
    </span>
  );
}
