"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Responsive panel: a bottom sheet on small screens, a floating card on
 * larger screens. Used for map previews and location selection.
 */
export function Sheet({
  open,
  onClose,
  children,
  title,
  className,
  side = "left",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
  side?: "left" | "right";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={title}
      className={cn(
        "pointer-events-auto absolute inset-x-0 bottom-0 z-30 max-h-[70vh] overflow-y-auto rounded-t-3xl border border-white/10 bg-navy-900/95 p-5 shadow-soft backdrop-blur-md animate-fade-up",
        "sm:inset-auto sm:bottom-auto sm:top-20 sm:w-[380px] sm:max-h-[calc(100vh-7rem)] sm:rounded-2xl",
        side === "left" ? "sm:left-4" : "sm:right-4",
        className,
      )}
    >
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15 sm:hidden" aria-hidden />
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 rounded-full p-2 text-ivory-400 hover:bg-white/10 hover:text-ivory-100"
        aria-label="Close"
      >
        <X size={18} />
      </button>
      {title && <h2 className="pr-8 text-xl text-ivory-100">{title}</h2>}
      {children}
    </div>
  );
}
