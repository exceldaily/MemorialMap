import Link from "next/link";
import { Footer } from "@/components/layout/Footer";

export default function MemorialNotFound() {
  return (
    <>
      <main className="container-page flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
        <div className="mb-6 h-12 w-12 rounded-full border border-gold-400/40 bg-gold-400/10" aria-hidden />
        <p className="eyebrow mb-2">Not found</p>
        <h1 className="text-4xl text-ivory-50 sm:text-5xl">We couldn&rsquo;t find that memorial</h1>
        <p className="mt-3 max-w-md text-ivory-400">The link may be incomplete, the memorial may be private, or it may have been removed by its family.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/map" className="btn-primary">
            Explore the Memorial Map
          </Link>
          <Link href="/search" className="btn-secondary">
            Search by name
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
