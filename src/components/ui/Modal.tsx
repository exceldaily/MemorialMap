"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({ open, onClose, title, children, className }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; className?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={cn("card relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl p-6 sm:rounded-2xl animate-fade-up", className)}
      >
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 rounded-full p-2 text-ivory-400 hover:bg-white/10">
          <X size={18} />
        </button>
        {title && <h2 className="mb-4 pr-8 text-2xl text-ivory-100">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
