import type { ReactNode } from "react";
import { accentVars, backgroundLayerStyle, readAppearance, THEMES } from "@/lib/appearance";
import { publicUrl } from "@/lib/storage";
import type { Json } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

/**
 * Scopes a memorial's theme, font and accent to its own page by overriding the
 * design tokens on a wrapper. Everything rendered inside inherits the palette.
 */
export function MemorialThemeFrame({
  appearance,
  accent,
  children,
  className,
}: {
  appearance: Json | null | undefined;
  accent: string | null | undefined;
  children: ReactNode;
  className?: string;
}) {
  const a = readAppearance(appearance);
  const bgUrl = a.background?.image_path ? publicUrl(a.background.image_path) : null;
  return (
    <div className={cn("memorial-page", THEMES[a.theme].light && "is-light", bgUrl && "has-bg", className)} data-theme={a.theme} data-font={a.font} style={accentVars(accent)}>
      {bgUrl && a.background && <div aria-hidden className="memorial-bg" style={backgroundLayerStyle(a.background, bgUrl)} />}
      {children}
    </div>
  );
}
