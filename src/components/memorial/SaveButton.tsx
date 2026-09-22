"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { toggleSaved } from "@/lib/actions/engagement";
import { cn } from "@/lib/utils";

export function SaveButton({
  memorialId,
  slug,
  initialSaved,
  signedIn,
  className,
}: {
  memorialId: string;
  slug: string;
  initialSaved: boolean;
  signedIn: boolean;
  className?: string;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <Link href={`/auth/sign-in?next=${encodeURIComponent(`/memorial/${slug}`)}`} className={cn("btn-secondary", className)} aria-label="Sign in to save this memorial">
        <Heart size={16} aria-hidden />
        Save
      </Link>
    );
  }

  const onClick = () => {
    setError(null);
    const next = !saved;
    setSaved(next);
    startTransition(async () => {
      const res = await toggleSaved({ memorial_id: memorialId, slug });
      if (!res.ok) {
        setSaved(!next);
        setError(res.error);
      } else if (res.data) {
        setSaved(res.data.saved);
      }
    });
  };

  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        aria-pressed={saved}
        aria-label={saved ? "Remove from saved memorials" : "Save this memorial"}
        className={cn(saved ? "btn border border-gold-400/50 bg-gold-400/15 text-gold-300 hover:bg-gold-400/25" : "btn-secondary", className)}
      >
        <Heart size={16} aria-hidden className={cn("transition-transform", saved && "scale-110 fill-current")} />
        {saved ? "Saved" : "Save"}
      </button>
      {error && (
        <span role="alert" className="mt-1 text-xs text-danger-400">
          {error}
        </span>
      )}
    </span>
  );
}
