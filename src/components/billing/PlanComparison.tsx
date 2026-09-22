import { Check, Minus } from "lucide-react";
import type { Json, Plan } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const LIMIT_LABELS: Record<string, string> = {
  max_photos: "Photos per memorial",
  max_videos: "Videos per memorial",
  videos: "Video memories",
  timeline: "Life timeline",
  family_connections: "Family connections",
  custom_appearance: "Custom memorial appearance",
  max_admins: "Additional administrators",
  max_memorials: "Memorials",
  family_groups: "Family memorial areas",
  max_family_groups: "Family memorial areas",
  family_landing_page: "Family landing page",
  shared_gallery: "Shared family gallery",
  family_tree: "Family tree",
  qr_codes: "QR codes",
};

function humanise(key: string) {
  return LIMIT_LABELS[key] ?? key.replace(/^max_/, "").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export type PlanFeature = { key: string; label: string; value: string; enabled: boolean };

/** Turns a plan's `limits` JSON into a readable feature list. */
export function planFeatures(limits: Json): PlanFeature[] {
  if (!limits || typeof limits !== "object" || Array.isArray(limits)) return [];
  return Object.entries(limits).map(([key, raw]) => {
    const label = humanise(key);
    if (typeof raw === "boolean") return { key, label, value: raw ? "Included" : "Not included", enabled: raw };
    if (raw === null) return { key, label, value: "Unlimited", enabled: true };
    if (typeof raw === "number") return { key, label, value: raw === 0 ? "None" : `Up to ${raw}`, enabled: raw > 0 };
    return { key, label, value: String(raw), enabled: true };
  });
}

export function formatPrice(plan: Pick<Plan, "price_cents" | "billing_interval">) {
  if (plan.price_cents == null || plan.price_cents === 0) return "Free";
  const amount = (plan.price_cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
  return plan.billing_interval ? `${amount} / ${plan.billing_interval}` : amount;
}

export function PlanComparison({ plans, currentPlan, className }: { plans: Plan[]; currentPlan?: string | null; className?: string }) {
  if (plans.length === 0) {
    return <p className="text-sm text-ivory-500">Plans will be announced soon.</p>;
  }
  return (
    <div className={cn("grid gap-5 md:grid-cols-3", className)}>
      {plans.map((plan) => {
        const features = planFeatures(plan.limits);
        const isCurrent = currentPlan != null && plan.code === currentPlan;
        const highlighted = plan.code === "premium";
        return (
          <section
            key={plan.code}
            aria-labelledby={`plan-${plan.code}`}
            className={cn("card relative flex flex-col p-6", highlighted && "border-gold-400/40 shadow-glow", isCurrent && "ring-2 ring-sage-400/50")}
          >
            {isCurrent && <span className="absolute right-4 top-4 rounded-full bg-sage-500/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-sage-300">Current plan</span>}
            <h3 id={`plan-${plan.code}`} className="text-2xl text-ivory-50">
              {plan.name}
            </h3>
            <p className="mt-1 font-display text-3xl text-gold-300">{formatPrice(plan)}</p>
            {plan.description && <p className="mt-3 text-sm text-ivory-400">{plan.description}</p>}
            <ul className="mt-6 space-y-2.5 text-sm">
              {features.map((f) => (
                <li key={f.key} className="flex items-start gap-2.5">
                  {f.enabled ? <Check size={16} className="mt-0.5 shrink-0 text-sage-300" aria-hidden /> : <Minus size={16} className="mt-0.5 shrink-0 text-ivory-500" aria-hidden />}
                  <span className={f.enabled ? "text-ivory-200" : "text-ivory-500"}>
                    {f.label}
                    <span className="text-ivory-500"> — {f.value}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-auto pt-6 text-xs text-ivory-500">
              {plan.is_default ? "Available to everyone today." : "Coming soon — no payment required today."}
            </p>
          </section>
        );
      })}
    </div>
  );
}
