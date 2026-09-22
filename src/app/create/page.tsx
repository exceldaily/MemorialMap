import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreateMemorialWizard } from "@/components/create/CreateMemorialWizard";
import { Footer } from "@/components/layout/Footer";
import { getCurrentProfile } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Create a Memorial",
  description: "Choose a place in the world and give their story somewhere to live forever.",
  robots: { index: false },
};

export default async function CreateMemorialPage() {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/auth/sign-in?next=/create");

  return (
    <>
      <main className="container-page py-8 sm:py-12">
        <div className="mb-8 max-w-2xl">
          <p className="eyebrow">Create a memorial</p>
          <p className="mt-2 text-ivory-300">A few gentle steps. Take your time — your progress is kept on this device until you publish.</p>
        </div>
        <CreateMemorialWizard userDisplayName={profile?.display_name ?? null} />
      </main>
      <Footer />
    </>
  );
}
