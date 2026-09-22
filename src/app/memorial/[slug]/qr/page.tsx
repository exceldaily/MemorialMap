import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QrPrintCard } from "@/components/memorial/QrPrintCard";
import { getMemorialBySlug, canManageRole } from "@/lib/queries/memorial";
import { lifeYears } from "@/lib/format";
import { memorialUrl, SITE_NAME } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await getMemorialBySlug(slug);
  const name = bundle?.memorial.full_name;
  return {
    title: name ? `QR code for ${name}` : "QR code",
    description: name ? `A printable QR code that links to the memorial of ${name} on ${SITE_NAME}.` : undefined,
    robots: { index: false, follow: false },
  };
}

export default async function MemorialQrPage({ params }: Props) {
  const { slug } = await params;
  const bundle = await getMemorialBySlug(slug);
  if (!bundle || bundle.memorial.status === "removed") notFound();
  const { memorial, viewerRole } = bundle;
  if (memorial.status === "suspended" && !canManageRole(viewerRole)) notFound();

  return (
    <main className="container-page py-10 sm:py-14">
      <h1 className="sr-only">Printable QR code for {memorial.full_name}</h1>
      <QrPrintCard url={memorialUrl(memorial.slug)} name={memorial.full_name} years={lifeYears(memorial.birth_year, memorial.death_year, memorial.memorial_type)} slug={memorial.slug} />
    </main>
  );
}
