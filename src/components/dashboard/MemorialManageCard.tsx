import Link from "next/link";
import { Eye, MessageCircle, Heart, Image as ImageIcon, MapPin, Pencil, ExternalLink, Lock, Link2, Globe } from "lucide-react";
import type { DashboardMemorial, MemorialStatus, PrivacyLevel } from "@/lib/supabase/types";
import { Avatar } from "@/components/ui/Avatar";
import { imageUrl } from "@/lib/storage";
import { lifeYears, timeAgo, compactNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<MemorialStatus, string> = {
  draft: "bg-white/8 text-ivory-300",
  published: "bg-sage-500/20 text-sage-300",
  suspended: "bg-gold-500/20 text-gold-300",
  removed: "bg-danger-500/15 text-danger-400",
};

const PRIVACY_META: Record<PrivacyLevel, { label: string; Icon: typeof Globe }> = {
  public: { label: "Public", Icon: Globe },
  unlisted: { label: "Unlisted", Icon: Link2 },
  private: { label: "Private", Icon: Lock },
};

export function StatusBadge({ status }: { status: MemorialStatus }) {
  return <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest", STATUS_STYLE[status])}>{status}</span>;
}

export function MemorialManageCard({ m }: { m: DashboardMemorial }) {
  const cover = imageUrl(m.cover_image_path, { width: 900, height: 300, quality: 70 });
  const privacy = PRIVACY_META[m.privacy];
  const canEdit = m.role === "owner" || m.role === "administrator";
  return (
    <article className="card overflow-hidden">
      <div className="relative h-20 bg-gradient-to-r from-navy-700 via-navy-800 to-gold-700/30" aria-hidden>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-full w-full object-cover opacity-70" loading="lazy" />
        )}
      </div>
      <div className="px-5 pb-5">
        <div className="-mt-7 flex items-end justify-between gap-3">
          <Avatar path={m.profile_image_path} name={m.full_name} size={56} className="ring-4 ring-navy-800" />
          <div className="flex flex-wrap items-center justify-end gap-1.5 pb-1">
            <StatusBadge status={m.status} />
            {m.pending_memories > 0 && (
              <Link href="/dashboard?tab=pending" className="rounded-full bg-gold-400/20 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest text-gold-300 hover:bg-gold-400/30">
                {m.pending_memories} awaiting approval
              </Link>
            )}
          </div>
        </div>
        <h3 className="mt-3 text-2xl leading-tight text-ivory-50">{m.full_name}</h3>
        <p className="text-sm text-gold-300">{lifeYears(m.birth_year, m.death_year) || "Dates not set"}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-ivory-500">
          <MapPin size={12} aria-hidden />
          {m.place_name ? <span className="truncate">{m.place_name}</span> : m.latitude != null ? <span>Memorial location chosen</span> : <span>No memorial location yet</span>}
        </p>
        <dl className="mt-4 grid grid-cols-4 gap-2 text-center text-xs text-ivory-400">
          {[
            { Icon: Eye, label: "Views", value: m.view_count },
            { Icon: MessageCircle, label: "Memories", value: m.memories_count },
            { Icon: Heart, label: "Tributes", value: m.tributes_count },
            { Icon: ImageIcon, label: "Photos", value: m.photos_count },
          ].map(({ Icon, label, value }) => (
            <div key={label} className="rounded-xl bg-white/4 py-2">
              <dt className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-ivory-500">
                <Icon size={11} aria-hidden /> {label}
              </dt>
              <dd className="mt-0.5 font-medium text-ivory-100">{compactNumber(value)}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-ivory-500">
          <span className="inline-flex items-center gap-1">
            <privacy.Icon size={12} aria-hidden /> {privacy.label}
            {m.role !== "owner" && <span className="ml-1 text-ivory-500">· {m.role}</span>}
          </span>
          <span>Updated {timeAgo(m.updated_at)}</span>
        </div>
        <div className="mt-4 flex gap-2">
          <Link href={`/memorial/${m.slug}`} className="btn-secondary flex-1 px-4 py-2 text-xs">
            <ExternalLink size={14} aria-hidden /> View
          </Link>
          {canEdit && (
            <Link href={`/memorial/${m.slug}/edit`} className="btn-primary flex-1 px-4 py-2 text-xs">
              <Pencil size={14} aria-hidden /> Edit
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
