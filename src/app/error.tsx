"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-3 text-4xl text-ivory-50 sm:text-5xl">We couldn&apos;t load this page</h1>
      <p className="mt-4 max-w-md text-ivory-400">
        It is not you — something on our side did not respond. Please try again in a moment. Nothing about the memorials you care for has been lost.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-ivory-500">Reference {error.digest}</p>}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={reset} className="btn-primary">
          <RotateCcw size={16} aria-hidden /> Try again
        </button>
        <Link href="/" className="btn-secondary">
          Back to the homepage
        </Link>
      </div>
    </main>
  );
}
