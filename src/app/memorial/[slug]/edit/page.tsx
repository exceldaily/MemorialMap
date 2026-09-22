import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EditShell, type EditTab, EDIT_TABS } from "@/components/edit/EditShell";
import { Footer } from "@/components/layout/Footer";
import { listMemorialAdmins, listMyFamilyGroups } from "@/lib/actions/memorial";
import { canManageRole, getMemorialBySlug } from "@/lib/queries/memorial";
import { getSessionUser } from "@/lib/supabase/server";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await getMemorialBySlug(slug);
  return {
    title: bundle ? `Manage ${bundle.memorial.full_name}` : "Manage memorial",
    robots: { index: false, follow: false },
  };
}

export default async function EditMemorialPage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<{ tab?: string }> }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const { supabase, user } = await getSessionUser();
  if (!user) redirect(`/auth/sign-in?next=/memorial/${slug}/edit`);

  const bundle = await getMemorialBySlug(slug);
  if (!bundle || !canManageRole(bundle.viewerRole)) notFound();
  const isOwner = bundle.viewerRole === "owner";

  const requested = (sp.tab ?? "details") as EditTab;
  const tab: EditTab = EDIT_TABS.some((t) => t.key === requested && (!("ownerOnly" in t && t.ownerOnly) || isOwner)) ? requested : "details";

  const [limitsRes, groupsRes, adminsRes] = await Promise.all([
    supabase.rpc("plan_limits", {}),
    listMyFamilyGroups(),
    isOwner ? listMemorialAdmins(bundle.memorial.id) : Promise.resolve({ ok: true as const, data: [] }),
  ]);

  return (
    <>
      <main className="container-page py-8 sm:py-10">
        <EditShell
          bundle={bundle}
          tab={tab}
          isOwner={isOwner}
          limits={(limitsRes.data as Record<string, unknown> | null) ?? {}}
          familyGroups={groupsRes.ok ? (groupsRes.data ?? []) : []}
          admins={adminsRes.ok ? (adminsRes.data ?? []) : []}
        />
      </main>
      <Footer />
    </>
  );
}
