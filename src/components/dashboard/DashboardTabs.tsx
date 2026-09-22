import Link from "next/link";
import { cn } from "@/lib/utils";

export type DashboardTab = "memorials" | "family" | "pending" | "saved" | "account" | "billing";

export const DASHBOARD_TABS: { key: DashboardTab; label: string }[] = [
  { key: "memorials", label: "My Memorials" },
  { key: "family", label: "Family Memorials" },
  { key: "pending", label: "Awaiting Approval" },
  { key: "saved", label: "Saved" },
  { key: "account", label: "Account" },
  { key: "billing", label: "Billing" },
];

export function isDashboardTab(v: string | undefined): v is DashboardTab {
  return DASHBOARD_TABS.some((t) => t.key === v);
}

export function DashboardTabs({ active, counts }: { active: DashboardTab; counts: Partial<Record<DashboardTab, number>> }) {
  return (
    <nav aria-label="Dashboard sections" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b border-white/8">
        {DASHBOARD_TABS.map((t) => {
          const isActive = t.key === active;
          const count = counts[t.key];
          return (
            <li key={t.key}>
              <Link
                href={t.key === "memorials" ? "/dashboard" : `/dashboard?tab=${t.key}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm transition-colors",
                  isActive ? "border-gold-400 text-ivory-50" : "border-transparent text-ivory-400 hover:text-ivory-100",
                )}
              >
                {t.label}
                {count != null && count > 0 && (
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", t.key === "pending" ? "bg-gold-400/20 text-gold-300" : "bg-white/8 text-ivory-300")}>
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
