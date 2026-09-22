import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { lifeYears } from "@/lib/format";
import { RELATIONSHIP_LABELS } from "@/lib/site";
import type { FamilyGroup, FamilyOfRow, RelationshipType } from "@/lib/supabase/types";
import { SectionHeading } from "./SectionHeading";

/** When a relationship row points *to* this memorial, the label is read from the other side. */
const INVERSE: Record<RelationshipType, RelationshipType> = {
  parent: "child",
  child: "parent",
  grandparent: "grandchild",
  grandchild: "grandparent",
  spouse: "spouse",
  sibling: "sibling",
  other: "other",
};

export function relationshipLabel(row: FamilyOfRow) {
  if (row.direction === "incoming") {
    const t = INVERSE[row.relationship_type] ?? row.relationship_type;
    return RELATIONSHIP_LABELS[t] ?? RELATIONSHIP_LABELS.other;
  }
  return row.label?.trim() || RELATIONSHIP_LABELS[row.relationship_type] || RELATIONSHIP_LABELS.other;
}

export function FamilySection({ family, familyGroup }: { family: FamilyOfRow[]; familyGroup: FamilyGroup | null }) {
  if (family.length === 0 && !familyGroup) return null;

  return (
    <section id="family" aria-labelledby="family-heading" className="scroll-mt-32">
      <SectionHeading id="family-heading" eyebrow="Connected lives" title="Family" />

      {familyGroup && (
        <Link
          href={`/family/${familyGroup.slug}`}
          className="mb-6 flex items-center gap-4 rounded-2xl border border-sage-500/30 bg-sage-500/10 px-5 py-4 transition hover:border-sage-400/50 hover:bg-sage-500/15"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-500/20 text-sage-300" aria-hidden>
            <Users size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs uppercase tracking-[0.16em] text-sage-300">Family memorial area</span>
            <span className="block truncate font-display text-xl text-ivory-50">Part of the {familyGroup.name}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm text-sage-300">
            View {familyGroup.name}
            <ArrowRight size={14} aria-hidden />
          </span>
        </Link>
      )}

      {family.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {family.map((f) => (
            <li key={f.relationship_id}>
              <Link href={`/memorial/${f.slug}`} className="card flex items-center gap-4 p-4 transition hover:border-gold-400/40 hover:bg-navy-700/70">
                <Avatar path={f.profile_image_path} name={f.full_name} size={56} />
                <span className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-[0.16em] text-gold-400">{relationshipLabel(f)}</span>
                  <span className="block truncate font-display text-xl text-ivory-50">{f.full_name}</span>
                  <span className="block text-xs text-ivory-400">{lifeYears(f.birth_year, f.death_year)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
