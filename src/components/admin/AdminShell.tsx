import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Page header used by every admin section. */
export function AdminHeader({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl text-ivory-50 sm:text-4xl">{title}</h1>
        {body && <p className="mt-1 max-w-2xl text-sm text-ivory-400">{body}</p>}
      </div>
      {action}
    </header>
  );
}

/** Horizontal scrolling table wrapper with the admin look. */
export function AdminTable({ head, children, className }: { head: string[]; children: ReactNode; className?: string }) {
  return (
    <div className={cn("card overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-white/8 text-[11px] uppercase tracking-widest text-ivory-500">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-top text-ivory-200", className)}>{children}</td>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" }) {
  const styles = {
    neutral: "bg-white/8 text-ivory-300",
    good: "bg-sage-500/20 text-sage-300",
    warn: "bg-gold-500/20 text-gold-300",
    bad: "bg-danger-500/15 text-danger-400",
  }[tone];
  return <span className={cn("inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest", styles)}>{children}</span>;
}

/** Filter pills driven by search params (server-rendered links). */
export function FilterPills({ basePath, param, options, current, keep }: { basePath: string; param: string; options: { value: string; label: string }[]; current: string; keep?: Record<string, string | undefined> }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter">
      {options.map((o) => {
        const p = new URLSearchParams();
        for (const [k, v] of Object.entries(keep ?? {})) if (v) p.set(k, v);
        if (o.value) p.set(param, o.value);
        else p.delete(param);
        const qs = p.toString();
        const active = current === o.value;
        return (
          <Link
            key={o.value || "all"}
            href={qs ? `${basePath}?${qs}` : basePath}
            aria-current={active ? "page" : undefined}
            className={cn("rounded-full border px-3 py-1 text-xs transition", active ? "border-gold-400/60 bg-gold-400/15 text-gold-200" : "border-white/10 text-ivory-400 hover:text-ivory-100")}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}

/** Simple offset pagination for admin lists. */
export function AdminPagination({ basePath, offset, limit, hasMore, keep }: { basePath: string; offset: number; limit: number; hasMore: boolean; keep?: Record<string, string | undefined> }) {
  if (offset === 0 && !hasMore) return null;
  const href = (o: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(keep ?? {})) if (v) p.set(k, v);
    if (o > 0) p.set("offset", String(o));
    const qs = p.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm">
      {offset > 0 ? (
        <Link href={href(Math.max(0, offset - limit))} className="btn-secondary px-4 py-1.5 text-xs">
          Previous
        </Link>
      ) : (
        <span />
      )}
      {hasMore && (
        <Link href={href(offset + limit)} className="btn-secondary px-4 py-1.5 text-xs">
          Next
        </Link>
      )}
    </nav>
  );
}
