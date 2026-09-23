import Link from "next/link";
import { AlertTriangle, ExternalLink, Images, Film, Clock, Users, MapPin, Palette, QrCode, ShieldCheck, Sparkles, Trash2, FileText } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import type { FamilyGroupOption } from "@/components/create/FamilyGroupSelect";
import type { MemorialAdminWithProfile } from "@/lib/actions/memorial";
import type { MemorialBundle } from "@/lib/queries/memorial";
import { lifeYears } from "@/lib/format";
import type { MemorialStatus } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { AdminsTab } from "./AdminsTab";
import { AppearanceTab } from "./AppearanceTab";
import { DangerTab } from "./DangerTab";
import { DetailsTab } from "./DetailsTab";
import { FamilyTab } from "./FamilyTab";
import { LocationTab } from "./LocationTab";
import { PhotosTab } from "./PhotosTab";
import { SharingTab } from "./SharingTab";
import { TimelineTab } from "./TimelineTab";
import { TouchesTab } from "./TouchesTab";
import { VideosTab } from "./VideosTab";

export const EDIT_TABS = [
  { key: "details", label: "Details", Icon: FileText },
  { key: "appearance", label: "Appearance", Icon: Palette },
  { key: "touches", label: "Personal touches", Icon: Sparkles },
  { key: "photos", label: "Photos", Icon: Images },
  { key: "videos", label: "Videos", Icon: Film },
  { key: "timeline", label: "Timeline", Icon: Clock },
  { key: "family", label: "Family", Icon: Users },
  { key: "location", label: "Location", Icon: MapPin },
  { key: "sharing", label: "Sharing & QR", Icon: QrCode },
  { key: "admins", label: "Administrators", Icon: ShieldCheck, ownerOnly: true },
  { key: "danger", label: "Danger zone", Icon: Trash2, ownerOnly: true },
] as const;

export type EditTab = (typeof EDIT_TABS)[number]["key"];

const STATUS_STYLES: Record<MemorialStatus, string> = {
  draft: "border-ivory-400/30 bg-white/5 text-ivory-300",
  published: "border-sage-500/40 bg-sage-500/10 text-sage-300",
  suspended: "border-gold-500/40 bg-gold-500/10 text-gold-300",
  removed: "border-danger-500/40 bg-danger-500/10 text-danger-400",
};

export function StatusBadge({ status }: { status: MemorialStatus }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize", STATUS_STYLES[status])}>{status}</span>;
}

export function EditShell({
  bundle,
  tab,
  isOwner,
  limits,
  familyGroups,
  admins,
}: {
  bundle: MemorialBundle;
  tab: EditTab;
  isOwner: boolean;
  limits: Record<string, unknown>;
  familyGroups: FamilyGroupOption[];
  admins: MemorialAdminWithProfile[];
}) {
  const m = bundle.memorial;
  const base = `/memorial/${m.slug}/edit`;
  const tabs = EDIT_TABS.filter((t) => !("ownerOnly" in t && t.ownerOnly) || isOwner);
  const active = tabs.find((t) => t.key === tab) ?? tabs[0];

  return (
    <div>
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar path={m.profile_image_path} name={m.full_name} size={56} />
          <div>
            <p className="eyebrow">Manage memorial</p>
            <h1 className="mt-0.5 text-2xl text-ivory-50 sm:text-3xl">{m.full_name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ivory-400">
              {lifeYears(m.birth_year, m.death_year, m.memorial_type) && <span>{lifeYears(m.birth_year, m.death_year, m.memorial_type)}</span>}
              <StatusBadge status={m.status} />
              <span className="capitalize">{m.privacy}</span>
              <span className="text-ivory-500">· You are the {bundle.viewerRole}</span>
            </div>
          </div>
        </div>
        <Link href={`/memorial/${m.slug}`} className="btn-secondary self-start sm:self-auto">
          View memorial <ExternalLink size={15} aria-hidden />
        </Link>
      </header>

      {m.status === "suspended" && (
        <Alert kind="warning" className="mt-6">
          <span className="flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
            <span>
              This memorial is currently under review and is not visible to visitors.
              {m.suspended_reason ? ` Reason given: ${m.suspended_reason}` : ""} You can still edit it while our team reviews it.
            </span>
          </span>
        </Alert>
      )}
      {m.status === "draft" && (
        <Alert kind="info" className="mt-6">
          This memorial is a draft and only visible to you and the people who help manage it. Publish it from the Location tab once a memorial location is chosen.
        </Alert>
      )}

      {/* Tabs */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Memorial settings" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
          <ul className="flex gap-1 lg:sticky lg:top-24 lg:flex-col">
            {tabs.map((t) => {
              const isActive = t.key === active.key;
              return (
                <li key={t.key} className="shrink-0">
                  <Link
                    href={t.key === "details" ? base : `${base}?tab=${t.key}`}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm transition lg:rounded-xl",
                      isActive ? "bg-gold-400/15 text-ivory-50" : "text-ivory-300 hover:bg-white/5 hover:text-ivory-50",
                      t.key === "danger" && !isActive && "text-danger-400/80",
                    )}
                  >
                    <t.Icon size={16} aria-hidden /> {t.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <section className="min-w-0 animate-fade-in" key={active.key} aria-labelledby="edit-tab-title">
          <h2 id="edit-tab-title" className="sr-only">
            {active.label}
          </h2>
          {active.key === "details" && <DetailsTab memorial={m} isOwner={isOwner} limits={limits} />}
          {active.key === "appearance" && <AppearanceTab memorial={m} limits={limits} />}
          {active.key === "touches" && <TouchesTab memorial={m} limits={limits} />}
          {active.key === "photos" && <PhotosTab memorial={m} photos={bundle.photos} limits={limits} />}
          {active.key === "videos" && <VideosTab memorial={m} videos={bundle.videos} limits={limits} />}
          {active.key === "timeline" && <TimelineTab memorial={m} events={bundle.timeline} limits={limits} />}
          {active.key === "family" && <FamilyTab memorial={m} family={bundle.family} familyGroup={bundle.familyGroup} familyGroups={familyGroups} limits={limits} />}
          {active.key === "location" && <LocationTab memorial={m} location={bundle.location} />}
          {active.key === "sharing" && <SharingTab memorial={m} />}
          {active.key === "admins" && isOwner && <AdminsTab memorial={m} admins={admins} limits={limits} />}
          {active.key === "danger" && isOwner && <DangerTab memorial={m} />}
        </section>
      </div>
    </div>
  );
}
