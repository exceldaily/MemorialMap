"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const ADMIN_SECTIONS: { href: string; label: string }[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/memorials", label: "Memorials" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/memories", label: "Memories" },
  { href: "/admin/photos", label: "Photos" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/locations", label: "Locations" },
  { href: "/admin/blocked-areas", label: "Blocked areas" },
  { href: "/admin/family-groups", label: "Family groups" },
  { href: "/admin/activity", label: "Activity log" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
      <ul className="flex min-w-max gap-1 border-b border-white/8 lg:min-w-0 lg:flex-col lg:gap-0.5 lg:border-b-0">
        {ADMIN_SECTIONS.map((s) => {
          const active = s.href === "/admin" ? pathname === "/admin" : pathname.startsWith(s.href);
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex border-b-2 px-3 py-2.5 text-sm transition-colors lg:mb-0 lg:w-full lg:rounded-lg lg:border-b-0 lg:px-3 lg:py-2",
                  active ? "border-gold-400 text-ivory-50 lg:bg-white/8" : "border-transparent text-ivory-400 hover:text-ivory-100 lg:hover:bg-white/5",
                )}
              >
                {s.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
