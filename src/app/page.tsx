import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { HomeMapPreview } from "@/components/home/HomeMapPreview";
import { HowItWorks } from "@/components/home/HowItWorks";
import { RecentMemorials } from "@/components/home/RecentMemorials";
import { LOCATION_DISCLAIMER_FULL, SITE_DESCRIPTION, SITE_TAGLINE } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <main>
        {/* Hero ------------------------------------------------------------ */}
        <section className="relative overflow-hidden" aria-labelledby="hero-title">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] bg-[radial-gradient(ellipse_at_top,rgb(211_184_119/0.12),transparent_60%)]"
            aria-hidden
          />
          <div className="container-page relative pb-10 pt-20 text-center sm:pt-28">
            <p className="eyebrow animate-fade-in">A place on the world for every story</p>
            <h1 id="hero-title" className="mx-auto mt-5 max-w-4xl text-5xl leading-[1.05] text-ivory-50 animate-fade-up sm:text-6xl md:text-7xl">
              {SITE_TAGLINE}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-ivory-300 animate-fade-up [animation-delay:120ms] sm:text-xl">{SITE_DESCRIPTION}</p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 animate-fade-up [animation-delay:240ms] sm:flex-row">
              <Link href="/map" className="btn-primary w-full px-7 py-3 text-base sm:w-auto">
                Explore the Memorial Map <ArrowRight size={18} aria-hidden />
              </Link>
              <Link href="/create" className="btn-secondary w-full px-7 py-3 text-base sm:w-auto">
                Create a Memorial
              </Link>
            </div>
          </div>
          <div className="container-page relative pb-16 pt-6 animate-fade-up [animation-delay:360ms] sm:pb-24">
            <HomeMapPreview />
          </div>
        </section>

        <div className="divider" aria-hidden />

        <HowItWorks />

        <Suspense fallback={null}>
          <RecentMemorials />
        </Suspense>

        {/* Reassurance ----------------------------------------------------- */}
        <section className="container-page pb-20 sm:pb-28" aria-labelledby="reassurance">
          <div className="mx-auto max-w-3xl rounded-3xl border border-white/8 bg-navy-950/40 px-6 py-10 text-center sm:px-12">
            <h2 id="reassurance" className="text-3xl text-ivory-100">
              A gentle note on locations
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ivory-400">{LOCATION_DISCLAIMER_FULL}</p>
            <p className="mt-6 text-sm text-ivory-300">
              Ready when you are.{" "}
              <Link href="/create" className="text-gold-300 underline-offset-4 hover:underline">
                Create a memorial
              </Link>{" "}
              or{" "}
              <Link href="/about" className="text-gold-300 underline-offset-4 hover:underline">
                read how it works
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
