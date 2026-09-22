import Link from "next/link";
import { Footer } from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <main className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <span className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full border border-gold-400/40 bg-gold-400/10" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-gold-400 shadow-[0_0_14px_rgb(211_184_119/0.8)]" />
        </span>
        <p className="eyebrow">Page not found</p>
        <h1 className="mt-3 text-4xl text-ivory-50 sm:text-5xl">This place is not on the map</h1>
        <p className="mt-4 max-w-md text-ivory-400">The page you were looking for may have moved, been made private, or never existed. The map is always a good place to start again.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/map" className="btn-primary">
            Explore the Memorial Map
          </Link>
          <Link href="/search" className="btn-secondary">
            Search memorials
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
