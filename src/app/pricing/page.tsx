import type { Metadata } from "next";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Plan } from "@/lib/supabase/types";
import { Footer } from "@/components/layout/Footer";
import { Alert } from "@/components/ui/Alert";
import { PlanComparison } from "@/components/billing/PlanComparison";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = { title: "Plans", description: `Free, Premium and Family memorial plans on ${SITE_NAME}. Creating a memorial is free; payments are coming soon.` };

export default async function PricingPage() {
  let plans: Plan[] = [];
  let failed = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("plans").select("*").eq("is_active", true).order("sort_order", { ascending: true });
    if (error) failed = true;
    plans = data ?? [];
  } catch {
    failed = true;
  }

  return (
    <>
      <main className="container-page py-14 sm:py-20">
        <header className="mx-auto mb-12 max-w-2xl text-center">
          <p className="eyebrow">Plans</p>
          <h1 className="mt-3 text-4xl text-ivory-50 sm:text-5xl md:text-6xl">Free to begin, always</h1>
          <p className="mt-5 text-lg text-ivory-300">Every memorial starts free. Premium and Family plans add room for more — and they are coming soon, with no payment required today.</p>
        </header>
        {failed && <Alert kind="error" className="mb-6">We couldn&apos;t load the plans right now. Please try again shortly.</Alert>}
        <PlanComparison plans={plans} />
        <Alert kind="warning" className="mx-auto mt-8 max-w-2xl text-center">
          Payments coming soon. Nothing is charged today, and we will never move an existing memorial behind a paywall.
        </Alert>
        <div className="mt-12 text-center">
          <Link href="/create" className="btn-primary px-7 py-3 text-base">
            Create a Memorial — free
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
