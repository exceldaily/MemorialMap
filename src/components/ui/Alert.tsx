import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Alert({ kind = "info", children, className }: { kind?: "info" | "success" | "error" | "warning"; children: ReactNode; className?: string }) {
  const styles = {
    info: "border-white/10 bg-white/5 text-ivory-200",
    success: "border-sage-500/40 bg-sage-500/10 text-sage-300",
    error: "border-danger-500/40 bg-danger-500/10 text-danger-400",
    warning: "border-gold-500/40 bg-gold-500/10 text-gold-300",
  }[kind];
  return (
    <div role={kind === "error" ? "alert" : "status"} className={cn("rounded-xl border px-4 py-3 text-sm", styles, className)}>
      {children}
    </div>
  );
}
