"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, Globe, Link2, Mail, MessageCircle, QrCode, Send, Share2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

export function ShareModal({ open, onClose, url, name, slug }: { open: boolean; onClose: () => void; url: string; name: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  const text = `Remembering ${name}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: text, text, url });
      onClose();
    } catch {
      /* user dismissed */
    }
  };

  const targets: { label: string; href: string; icon: React.ReactNode }[] = [
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, icon: <Globe size={18} aria-hidden /> },
    { label: "Messenger", href: `https://www.facebook.com/dialog/send?link=${encodedUrl}&redirect_uri=${encodedUrl}`, icon: <Send size={18} aria-hidden /> },
    { label: "LINE", href: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`, icon: <MessageCircle size={18} aria-hidden /> },
    { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${text} — ${url}`)}`, icon: <MessageCircle size={18} aria-hidden /> },
    { label: "Email", href: `mailto:?subject=${encodedText}&body=${encodeURIComponent(`I wanted to share this memorial with you.\n\n${url}`)}`, icon: <Mail size={18} aria-hidden /> },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Share this memorial">
      <p className="mb-5 text-sm text-ivory-400">Send {name}&rsquo;s memorial to family and friends.</p>

      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-navy-950/60 p-2 pl-3">
        <Link2 size={16} className="shrink-0 text-ivory-500" aria-hidden />
        <input readOnly value={url} aria-label="Memorial link" onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 bg-transparent text-sm text-ivory-200 outline-none" />
        <button type="button" onClick={copy} className="btn-primary shrink-0 !px-4 !py-2" aria-live="polite">
          {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {canNativeShare && (
          <li>
            <button type="button" onClick={nativeShare} className="btn-secondary w-full">
              <Share2 size={18} aria-hidden />
              Share…
            </button>
          </li>
        )}
        {targets.map((t) => (
          <li key={t.label}>
            <a href={t.href} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full" aria-label={`Share on ${t.label}`}>
              {t.icon}
              {t.label}
            </a>
          </li>
        ))}
      </ul>

      <div className="divider my-5" />
      <Link href={`/memorial/${slug}/qr`} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 px-4 py-3 text-sm text-ivory-200 transition hover:bg-white/8">
        <QrCode size={20} className="text-gold-400" aria-hidden />
        <span>
          <span className="block font-medium text-ivory-100">Printable QR code</span>
          <span className="block text-xs text-ivory-400">For plaques, frames, urns and benches.</span>
        </span>
      </Link>
    </Modal>
  );
}
