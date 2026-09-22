"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export type Feedback = { kind: "success" | "error"; text: string } | null;

/**
 * Small helper for admin action buttons: runs a server action inside a
 * transition, surfaces its result as feedback and refreshes server data.
 */
export function useAdminAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, successText = "Done.") => {
    setFeedback(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        setFeedback({ kind: "success", text: successText });
        router.refresh();
      } else {
        setFeedback({ kind: "error", text: res.error ?? "Something went wrong." });
      }
    });
  };

  return { run, pending, feedback, clear: () => setFeedback(null) };
}

/** Prompts for an optional note; returns null when the admin cancels. */
export function askNote(message: string, defaultValue = ""): string | null {
  const v = window.prompt(message, defaultValue);
  return v === null ? null : v.trim();
}
