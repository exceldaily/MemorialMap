import type { ReactNode } from "react";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/utils";

export function Section({ title, description, children, className, actions }: { title: string; description?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <div className={cn("card p-5 sm:p-7", className)}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-2xl text-ivory-50">{title}</h3>
          {description && <p className="mt-1 max-w-2xl text-sm text-ivory-400">{description}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/** `false` means the feature is not on the plan; anything else (true/undefined) allows it. */
export function planAllows(limits: Record<string, unknown>, key: string) {
  return limits[key] !== false;
}

/** Numeric limit; null/undefined means unlimited. */
export function planNumber(limits: Record<string, unknown>, key: string): number | null {
  const v = limits[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function PlanNotice({ feature }: { feature: string }) {
  return (
    <Alert kind="warning">
      {feature} {feature.endsWith("s") ? "are" : "is"} not included in your current plan. Existing content stays visible; upgrade your plan to add more.
    </Alert>
  );
}

export function SaveBar({ pending, saved, error, label = "Save changes", onSave, disabled }: { pending: boolean; saved: boolean; error: string | null; label?: string; onSave: () => void; disabled?: boolean }) {
  return (
    <div className="mt-6 flex flex-col gap-3 border-t border-white/8 pt-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 text-sm" aria-live="polite">
        {error && <span className="text-danger-400">{error}</span>}
        {!error && saved && <span className="text-sage-300">Saved.</span>}
      </div>
      <button type="button" className="btn-primary" onClick={onSave} disabled={pending || disabled}>
        {pending ? "Saving…" : label}
      </button>
    </div>
  );
}
