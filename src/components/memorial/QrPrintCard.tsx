"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Printer } from "lucide-react";
import { SITE_NAME } from "@/lib/site";

export function QrPrintCard({ url, name, years, slug }: { url: string; name: string; years: string; slug: string }) {
  return (
    <div className="qr-page">
      <style>{`
        @media print {
          @page { margin: 16mm; }
          body, html { background: #fff !important; color: #111 !important; }
          header, footer, nav, .no-print { display: none !important; }
          #main { padding-top: 0 !important; }
          .qr-page { min-height: 0 !important; padding: 0 !important; }
          .qr-card { box-shadow: none !important; border: none !important; background: #fff !important; color: #111 !important; }
          .qr-card * { color: #111 !important; }
          .qr-card .qr-years { color: #555 !important; }
        }
      `}</style>

      <div className="no-print mb-6 flex items-center justify-between gap-3">
        <Link href={`/memorial/${slug}`} className="btn-ghost -ml-3">
          <ArrowLeft size={16} aria-hidden />
          Back to memorial
        </Link>
        <button type="button" onClick={() => window.print()} className="btn-primary">
          <Printer size={16} aria-hidden />
          Print
        </button>
      </div>

      <div className="qr-card mx-auto flex w-full max-w-md flex-col items-center rounded-3xl border border-white/10 bg-white p-8 text-center text-navy-950 shadow-soft sm:p-10">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold-700">Scan to visit</p>
        <div className="mt-5 rounded-2xl bg-white p-3 ring-1 ring-black/5">
          <QRCodeSVG value={url} size={320} level="M" marginSize={1} bgColor="#ffffff" fgColor="#0b1220" title={`QR code linking to the memorial of ${name}`} className="h-auto w-full max-w-[320px]" />
        </div>
        <p className="mt-6 font-display text-3xl leading-tight">{name}</p>
        {years && <p className="qr-years mt-1 font-display text-lg text-navy-600">{years}</p>}
        <p className="mt-5 max-w-xs break-all text-xs text-navy-600">{url}</p>
        <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-navy-600">{SITE_NAME}</p>
      </div>

      <p className="no-print mx-auto mt-6 max-w-md text-center text-xs text-ivory-500">
        Print this card for a plaque, frame, urn or bench. Anyone who scans it will open {name}&rsquo;s memorial.
      </p>
    </div>
  );
}
