import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { getSessionUser } from "@/lib/supabase/server";
import { FamilyGroupForm } from "./FamilyGroupForm";

export const metadata: Metadata = {
  title: "New Family Group",
  description: "Create a family memorial area to bring related memorials together.",
  robots: { index: false },
};

export default async function NewFamilyGroupPage() {
  const { user } = await getSessionUser();
  if (!user) redirect("/auth/sign-in?next=/family/new");

  return (
    <>
      <main className="container-page py-10 sm:py-14">
        <div className="mx-auto max-w-xl">
          <p className="eyebrow">Family memorial area</p>
          <h1 className="mt-2 text-4xl text-ivory-50">Create a family group</h1>
          <p className="mt-3 text-ivory-300">Give your family a shared name so their memorials can be found — and rest — together.</p>
          <div className="mt-8">
            <FamilyGroupForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
