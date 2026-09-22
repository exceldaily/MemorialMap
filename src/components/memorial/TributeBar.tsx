"use client";

import { useState, useTransition } from "react";
import { addTribute } from "@/lib/actions/engagement";
import { TRIBUTES } from "@/lib/site";
import { compactNumber } from "@/lib/format";
import { cn, getVisitorKey } from "@/lib/utils";
import type { TributeType } from "@/lib/supabase/types";
import { SectionHeading } from "./SectionHeading";

export function TributeBar({ memorialId, initialCounts, signedIn }: { memorialId: string; initialCounts: Record<string, number>; signedIn: boolean }) {
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [message, setMessage] = useState<string | null>(null);
  const [pulse, setPulse] = useState<TributeType | null>(null);
  const [busy, setBusy] = useState<TributeType | null>(null);
  const [, startTransition] = useTransition();

  const leave = (type: TributeType) => {
    setMessage(null);
    setBusy(type);
    const before = counts[type] ?? 0;
    setCounts((c) => ({ ...c, [type]: before + 1 }));
    setPulse(type);
    setTimeout(() => setPulse(null), 700);
    startTransition(async () => {
      const res = await addTribute({ memorial_id: memorialId, type, visitor_key: signedIn ? undefined : getVisitorKey() });
      setBusy(null);
      if (!res.ok) {
        setCounts((c) => ({ ...c, [type]: before }));
        setMessage(res.error);
        return;
      }
      if (res.data) {
        setCounts(res.data.counts);
        if (!res.data.added) setMessage("You've already left this today.");
        else setMessage("Thank you. Your tribute has been added.");
      }
    });
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <section id="tributes" aria-labelledby="tributes-heading" className="scroll-mt-32">
      <SectionHeading id="tributes-heading" eyebrow="A small gesture" title="Tributes" aside={total > 0 ? `${compactNumber(total)} left so far` : undefined} />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TRIBUTES.map((t) => {
          const n = counts[t.type] ?? 0;
          return (
            <li key={t.type}>
              <button
                type="button"
                onClick={() => leave(t.type)}
                disabled={busy === t.type}
                aria-label={`${t.label} (${n} so far)`}
                className={cn(
                  "card group flex w-full flex-col items-center gap-2 px-3 py-5 text-center transition hover:border-gold-400/40 hover:bg-navy-700/70 active:scale-[0.98]",
                  pulse === t.type && "border-gold-400/60 shadow-glow",
                )}
              >
                <span aria-hidden className={cn("text-3xl transition-transform duration-500", pulse === t.type ? "scale-125" : "group-hover:scale-110")}>
                  {t.emoji}
                </span>
                <span className="font-display text-lg leading-tight text-ivory-50">{t.label}</span>
                <span className="text-xs text-ivory-400" aria-hidden>
                  {compactNumber(n)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p role="status" aria-live="polite" className={cn("mt-3 min-h-5 text-center text-sm", message ? "text-gold-300 animate-fade-in" : "text-transparent")}>
        {message ?? " "}
      </p>
    </section>
  );
}
