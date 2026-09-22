import Link from "next/link";
import { SITE_NAME, LOCATION_DISCLAIMER_FULL } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-navy-950/60">
      <div className="container-page grid gap-8 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-2xl text-ivory-50">{SITE_NAME}</p>
          <p className="mt-2 max-w-md text-sm text-ivory-400">
            Every person can have a permanent place on the world where their story can be remembered.
          </p>
          <p className="mt-4 max-w-md text-xs leading-relaxed text-ivory-500">{LOCATION_DISCLAIMER_FULL}</p>
        </div>
        <nav aria-label="Explore" className="text-sm">
          <p className="eyebrow mb-3">Explore</p>
          <ul className="space-y-2 text-ivory-300">
            <li><Link href="/map" className="hover:text-ivory-50">Memorial Map</Link></li>
            <li><Link href="/search" className="hover:text-ivory-50">Search</Link></li>
            <li><Link href="/create" className="hover:text-ivory-50">Create a Memorial</Link></li>
            <li><Link href="/pricing" className="hover:text-ivory-50">Plans</Link></li>
          </ul>
        </nav>
        <nav aria-label="Legal" className="text-sm">
          <p className="eyebrow mb-3">About</p>
          <ul className="space-y-2 text-ivory-300">
            <li><Link href="/about" className="hover:text-ivory-50">How it works</Link></li>
            <li><Link href="/terms" className="hover:text-ivory-50">Terms</Link></li>
            <li><Link href="/privacy" className="hover:text-ivory-50">Privacy</Link></li>
            <li><Link href="/contact" className="hover:text-ivory-50">Contact</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-ivory-500">
        © {new Date().getFullYear()} {SITE_NAME}. Memorial locations are virtual markers within this platform.
      </div>
    </footer>
  );
}
