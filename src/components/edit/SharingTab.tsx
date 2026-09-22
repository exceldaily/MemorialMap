"use client";

import { useRef, useState } from "react";
import { Check, Copy, Download, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Alert } from "@/components/ui/Alert";
import { memorialUrl } from "@/lib/site";
import type { Memorial } from "@/lib/supabase/types";
import { Section } from "./shared";

export function SharingTab({ memorial }: { memorial: Memorial }) {
  const url = memorialUrl(memorial.slug);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const fileBase = `${memorial.slug}-memorial-qr`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  function downloadPng() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const size = 1024;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(objectUrl);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `${fileBase}.png`;
      a.click();
    };
    img.src = objectUrl;
  }

  const shareText = encodeURIComponent(`In memory of ${memorial.full_name}`);
  const encoded = encodeURIComponent(url);
  const shares = [
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}` },
    { label: "WhatsApp", href: `https://wa.me/?text=${shareText}%20${encoded}` },
    { label: "LINE", href: `https://social-plugins.line.me/lineit/share?url=${encoded}` },
    { label: "Email", href: `mailto:?subject=${shareText}&body=${encoded}` },
  ];

  return (
    <div className="space-y-6">
      {memorial.status !== "published" && <Alert kind="warning">This memorial is not published yet, so the link will only work for people who help manage it.</Alert>}
      {memorial.privacy === "private" && memorial.status === "published" && <Alert kind="info">This memorial is private. Only invited administrators and contributors can open the link.</Alert>}

      <Section title="Memorial link" description="A permanent address for this memorial. Share it anywhere.">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input className="input flex-1 font-mono text-sm" value={url} readOnly aria-label="Memorial link" onFocus={(e) => e.currentTarget.select()} />
          <button type="button" className="btn-primary" onClick={copy} aria-live="polite">
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy link"}
          </button>
          <a href={url} target="_blank" rel="noreferrer" className="btn-secondary" aria-label="Open memorial in a new tab">
            <ExternalLink size={16} /> Open
          </a>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {shares.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="btn-ghost border border-white/10 px-4 py-1.5 text-xs">
              Share on {s.label}
            </a>
          ))}
        </div>
      </Section>

      <Section title="QR code" description="Print it on a plaque, an urn, a bench, a photo frame or a keepsake card. Anyone who scans it is taken straight to the memorial.">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div ref={qrRef} className="rounded-2xl bg-white p-4 shadow-soft">
            <QRCodeSVG value={url} size={192} level="H" marginSize={1} bgColor="#ffffff" fgColor="#0b1220" title={`QR code for ${memorial.full_name}'s memorial`} />
          </div>
          <div className="flex-1 text-sm text-ivory-400">
            <p>The code encodes the memorial link above. It never expires — if you move the memorial location or change the details, the code still works.</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-ivory-500">
              <li>Download the PNG at 1024 × 1024 px for print.</li>
              <li>Keep a quiet zone of white space around the code.</li>
              <li>Test it with your phone before engraving.</li>
            </ul>
            <button type="button" className="btn-primary mt-5" onClick={downloadPng}>
              <Download size={16} /> Download PNG
            </button>
          </div>
        </div>
      </Section>
    </div>
  );
}
