import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";

/** Shared shell for long-form pages (about, terms, privacy, contact). */
export function StaticPage({ eyebrow, title, intro, children, wide }: { eyebrow: string; title: string; intro?: string; children: ReactNode; wide?: boolean }) {
  return (
    <>
      <main className="container-page py-14 sm:py-20">
        <header className={wide ? "mb-12 max-w-3xl" : "mx-auto mb-12 max-w-3xl"}>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-3 text-4xl text-ivory-50 sm:text-5xl md:text-6xl">{title}</h1>
          {intro && <p className="mt-5 text-lg text-ivory-300">{intro}</p>}
        </header>
        <div className={wide ? "" : "mx-auto max-w-3xl"}>{children}</div>
      </main>
      <Footer />
    </>
  );
}

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="border-t border-white/8 py-8 first:border-t-0 first:pt-0">
      <h2 id={`${id}-title`} className="text-3xl text-ivory-50">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[1.02rem] leading-relaxed text-ivory-300 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_a]:text-gold-300 [&_a]:underline-offset-4 hover:[&_a]:underline">{children}</div>
    </section>
  );
}
