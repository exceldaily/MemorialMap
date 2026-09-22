import Link from "next/link";
import type { ReactNode } from "react";
import { SITE_NAME } from "@/lib/site";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(211_184_119/0.12),transparent_55%)]" aria-hidden />
      <div className="card relative w-full max-w-md p-8 animate-fade-up">
        <Link href="/" className="eyebrow">
          {SITE_NAME}
        </Link>
        <h1 className="mt-3 text-3xl text-ivory-50">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-ivory-400">{subtitle}</p>}
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6 border-t border-white/10 pt-5 text-sm text-ivory-400">{footer}</div>}
      </div>
    </main>
  );
}
