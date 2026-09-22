"use client";

import { useEffect, useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { submitReport } from "@/lib/actions/engagement";
import { REPORT_REASONS } from "@/lib/site";
import type { ReportReason } from "@/lib/supabase/types";

export function ReportModal({
  open,
  onClose,
  memorialId,
  memoryId,
  signedIn,
  subject = "this memorial",
}: {
  open: boolean;
  onClose: () => void;
  memorialId?: string;
  memoryId?: string;
  signedIn: boolean;
  subject?: string;
}) {
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setReason("");
      setDetails("");
      setEmail("");
      setError(null);
      setDone(false);
    }
  }, [open]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!reason) {
      setError("Please choose a reason.");
      return;
    }
    startTransition(async () => {
      const res = await submitReport({
        memorial_id: memoryId ? undefined : memorialId,
        memory_id: memoryId,
        reason: reason as ReportReason,
        details,
        reporter_email: signedIn ? "" : email,
      });
      if (!res.ok) setError(res.error);
      else setDone(true);
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={`Report ${subject}`}>
      {done ? (
        <div className="space-y-4">
          <Alert kind="success">Thank you. Our team will review this report. We take every report seriously.</Alert>
          <button type="button" onClick={onClose} className="btn-secondary w-full">
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <p className="text-sm text-ivory-400">Tell us what&rsquo;s wrong. Reports are confidential and reviewed by our moderation team.</p>
          <div>
            <label htmlFor="report-reason" className="label">
              Reason
            </label>
            <select id="report-reason" value={reason} onChange={(e) => setReason(e.target.value)} required className="input">
              <option value="" disabled>
                Choose a reason
              </option>
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="report-details" className="label">
              Details <span className="normal-case tracking-normal text-ivory-500">(optional)</span>
            </label>
            <textarea id="report-details" value={details} onChange={(e) => setDetails(e.target.value)} rows={4} maxLength={2000} className="input resize-y" placeholder="Anything that helps us understand the issue." />
          </div>
          {!signedIn && (
            <div>
              <label htmlFor="report-email" className="label">
                Your email <span className="normal-case tracking-normal text-ivory-500">(optional, if you&rsquo;d like a reply)</span>
              </label>
              <input id="report-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" autoComplete="email" />
            </div>
          )}
          {error && <Alert kind="error">{error}</Alert>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" disabled={pending} className="btn-primary flex-1">
              {pending ? <Spinner className="h-4 w-4" /> : "Send report"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
