"use client";

import { useState } from "react";
import Link from "next/link";
import { Flag, PencilLine, Share2 } from "lucide-react";
import { SaveButton } from "./SaveButton";
import { ShareModal } from "./ShareModal";
import { ReportModal } from "./ReportModal";

export function HeroActions({
  memorialId,
  slug,
  name,
  url,
  isSaved,
  signedIn,
  canManage,
}: {
  memorialId: string;
  slug: string;
  name: string;
  url: string;
  isSaved: boolean;
  signedIn: boolean;
  canManage: boolean;
}) {
  const [share, setShare] = useState(false);
  const [report, setReport] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <SaveButton memorialId={memorialId} slug={slug} initialSaved={isSaved} signedIn={signedIn} />
      <button type="button" onClick={() => setShare(true)} className="btn-secondary" aria-haspopup="dialog">
        <Share2 size={16} aria-hidden />
        Share
      </button>
      <button type="button" onClick={() => setReport(true)} className="btn-ghost" aria-haspopup="dialog">
        <Flag size={16} aria-hidden />
        Report
      </button>
      {canManage && (
        <Link href={`/memorial/${slug}/edit`} className="btn-primary">
          <PencilLine size={16} aria-hidden />
          Edit memorial
        </Link>
      )}
      <ShareModal open={share} onClose={() => setShare(false)} url={url} name={name} slug={slug} />
      <ReportModal open={report} onClose={() => setReport(false)} memorialId={memorialId} signedIn={signedIn} />
    </div>
  );
}
