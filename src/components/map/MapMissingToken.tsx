import { cn } from "@/lib/utils";

export function MapMissingToken({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex h-full w-full items-center justify-center overflow-hidden bg-navy-950", className)}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(211_184_119/0.14),transparent_60%)]" aria-hidden />
      <div className="relative max-w-sm p-6 text-center">
        <p className="eyebrow">Map unavailable</p>
        <p className="mt-3 text-sm text-ivory-300">
          The interactive map needs a Mapbox access token. Add <code className="rounded bg-white/10 px-1">NEXT_PUBLIC_MAPBOX_TOKEN</code> to the environment and redeploy.
        </p>
      </div>
    </div>
  );
}
