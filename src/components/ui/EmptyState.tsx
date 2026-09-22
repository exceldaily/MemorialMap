import type { ReactNode } from "react";

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 h-10 w-10 rounded-full border border-gold-400/40 bg-gold-400/10" aria-hidden />
      <h3 className="text-2xl text-ivory-100">{title}</h3>
      {body && <p className="mt-2 max-w-md text-sm text-ivory-400">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
