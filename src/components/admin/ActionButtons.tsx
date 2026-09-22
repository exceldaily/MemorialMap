"use client";

import { Ban, Check, Eye, EyeOff, RotateCcw, ShieldCheck, ShieldOff, Trash2, XCircle, Search as SearchIcon } from "lucide-react";
import type { MemorialStatus, ModerationStatus, ReportStatus } from "@/lib/supabase/types";
import { adminSetMemorialStatus, adminResolveReport, adminSetUserBlocked, adminSetUserAdmin, adminSetPhotoStatus, adminDeletePhoto, adminSetAreaActive } from "@/lib/actions/admin";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { useAdminAction, askNote, type Feedback } from "./useAdminAction";

function FeedbackLine({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  return (
    <Alert kind={feedback.kind} className="mt-2 px-3 py-1.5 text-xs">
      {feedback.text}
    </Alert>
  );
}

const small = "px-3 py-1.5 text-xs";

/* ---- Memorials ---------------------------------------------------------- */

export function MemorialStatusActions({ id, slug, status }: { id: string; slug: string; status: MemorialStatus }) {
  const { run, pending, feedback } = useAdminAction();
  const set = (next: MemorialStatus, label: string, needsReason: boolean) => {
    let reason = "";
    if (needsReason) {
      const r = askNote(`Reason for marking this memorial as ${next} (shown to the owner):`);
      if (r === null) return;
      reason = r;
    } else if (!window.confirm(`${label} this memorial?`)) return;
    run(() => adminSetMemorialStatus({ id, slug, status: next, reason }), `Memorial ${next}.`);
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {pending && <Spinner className="h-4 w-4 self-center" />}
        {status !== "suspended" && status !== "removed" && (
          <button type="button" disabled={pending} onClick={() => set("suspended", "Suspend", true)} className={`btn-secondary ${small}`}>
            <EyeOff size={13} aria-hidden /> Suspend
          </button>
        )}
        {status !== "removed" && (
          <button type="button" disabled={pending} onClick={() => set("removed", "Remove", true)} className={`btn-danger ${small}`}>
            <Trash2 size={13} aria-hidden /> Remove
          </button>
        )}
        {(status === "suspended" || status === "removed") && (
          <button type="button" disabled={pending} onClick={() => set("published", "Restore", false)} className={`btn-primary ${small}`}>
            <RotateCcw size={13} aria-hidden /> Restore
          </button>
        )}
      </div>
      <FeedbackLine feedback={feedback} />
    </div>
  );
}

/* ---- Reports ------------------------------------------------------------ */

export function ReportActions({ id, status }: { id: string; status: ReportStatus }) {
  const { run, pending, feedback } = useAdminAction();
  const set = (next: ReportStatus, withNote: boolean) => {
    let note = "";
    if (withNote) {
      const n = askNote(`Resolution note (${next}):`);
      if (n === null) return;
      note = n;
    }
    run(() => adminResolveReport({ id, status: next, note }), `Report marked ${next}.`);
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {pending && <Spinner className="h-4 w-4 self-center" />}
        {status === "open" && (
          <button type="button" disabled={pending} onClick={() => set("reviewing", false)} className={`btn-secondary ${small}`}>
            <SearchIcon size={13} aria-hidden /> Mark reviewing
          </button>
        )}
        {status !== "resolved" && (
          <button type="button" disabled={pending} onClick={() => set("resolved", true)} className={`btn-primary ${small}`}>
            <Check size={13} aria-hidden /> Resolve
          </button>
        )}
        {status !== "dismissed" && (
          <button type="button" disabled={pending} onClick={() => set("dismissed", true)} className={`btn-ghost ${small} border border-white/10`}>
            <XCircle size={13} aria-hidden /> Dismiss
          </button>
        )}
        {(status === "resolved" || status === "dismissed") && (
          <button type="button" disabled={pending} onClick={() => set("open", false)} className={`btn-ghost ${small} border border-white/10`}>
            <RotateCcw size={13} aria-hidden /> Reopen
          </button>
        )}
      </div>
      <FeedbackLine feedback={feedback} />
    </div>
  );
}

/* ---- Users -------------------------------------------------------------- */

export function UserActions({ userId, isBlocked, isAdmin, isSelf }: { userId: string; isBlocked: boolean; isAdmin: boolean; isSelf: boolean }) {
  const { run, pending, feedback } = useAdminAction();
  const toggleBlock = () => {
    if (isBlocked) {
      if (!window.confirm("Unblock this user?")) return;
      run(() => adminSetUserBlocked({ userId, blocked: false }), "User unblocked.");
      return;
    }
    const r = askNote("Reason for blocking this user:");
    if (r === null) return;
    run(() => adminSetUserBlocked({ userId, blocked: true, reason: r }), "User blocked.");
  };
  const toggleAdmin = () => {
    if (!window.confirm(isAdmin ? "Remove administrator access from this user?" : "Grant administrator access to this user?")) return;
    run(() => adminSetUserAdmin({ userId, isAdmin: !isAdmin }), isAdmin ? "Administrator access removed." : "Administrator access granted.");
  };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {pending && <Spinner className="h-4 w-4 self-center" />}
        <button type="button" disabled={pending || (isSelf && !isBlocked)} onClick={toggleBlock} className={isBlocked ? `btn-primary ${small}` : `btn-danger ${small}`}>
          {isBlocked ? <Check size={13} aria-hidden /> : <Ban size={13} aria-hidden />} {isBlocked ? "Unblock" : "Block"}
        </button>
        <button type="button" disabled={pending || (isSelf && isAdmin)} onClick={toggleAdmin} className={`btn-secondary ${small}`}>
          {isAdmin ? <ShieldOff size={13} aria-hidden /> : <ShieldCheck size={13} aria-hidden />} {isAdmin ? "Revoke admin" : "Make admin"}
        </button>
      </div>
      <FeedbackLine feedback={feedback} />
    </div>
  );
}

/* ---- Photos ------------------------------------------------------------- */

export function PhotoActions({ id, slug, status }: { id: string; slug: string; status: ModerationStatus }) {
  const { run, pending, feedback } = useAdminAction();
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {pending && <Spinner className="h-4 w-4 self-center" />}
        {status !== "hidden" ? (
          <button type="button" disabled={pending} onClick={() => run(() => adminSetPhotoStatus({ id, slug, status: "hidden" }), "Photo hidden.")} className={`btn-secondary ${small}`}>
            <EyeOff size={13} aria-hidden /> Hide
          </button>
        ) : (
          <button type="button" disabled={pending} onClick={() => run(() => adminSetPhotoStatus({ id, slug, status: "approved" }), "Photo restored.")} className={`btn-primary ${small}`}>
            <Eye size={13} aria-hidden /> Restore
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (window.confirm("Delete this photo permanently?")) run(() => adminDeletePhoto({ id, slug }), "Photo deleted.");
          }}
          className={`btn-danger ${small}`}
        >
          <Trash2 size={13} aria-hidden /> Delete
        </button>
      </div>
      <FeedbackLine feedback={feedback} />
    </div>
  );
}

/* ---- Blocked areas ------------------------------------------------------ */

export function AreaActiveToggle({ id, active }: { id: string; active: boolean }) {
  const { run, pending, feedback } = useAdminAction();
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (window.confirm(active ? "Deactivate this blocked area? New memorial locations inside it will be allowed again." : "Reactivate this blocked area?"))
            run(() => adminSetAreaActive({ id, active: !active }), active ? "Area deactivated." : "Area reactivated.");
        }}
        className={active ? `btn-secondary ${small}` : `btn-primary ${small}`}
      >
        {pending ? <Spinner className="h-3.5 w-3.5" /> : active ? <XCircle size={13} aria-hidden /> : <Check size={13} aria-hidden />} {active ? "Deactivate" : "Reactivate"}
      </button>
      <FeedbackLine feedback={feedback} />
    </div>
  );
}
