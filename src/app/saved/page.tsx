import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/supabase/server";
import type { DashboardSaved } from "@/lib/supabase/types";
import { Footer } from "@/components/layout/Footer";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { MemorialCard } from "@/components/cards/MemorialCard";
import { timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Saved memorials", robots: { index: false, follow: false } };

export default async function SavedPage() {
  const { supabase, user } = await getSessionUser();
  if (!user) redirect("/auth/sign-in?next=/saved");
  const { data, error } = await supabase.rpc("my_dashboard");
  const saved: DashboardSaved[] = data?.saved ?? [];

  return (
    <>
      <main className="container-page py-10 sm:py-14">
        <header className="mb-8">
          <p className="eyebrow">Saved</p>
          <h1 className="mt-2 text-4xl text-ivory-50 sm:text-5xl">Saved memorials</h1>
          <p className="mt-2 max-w-xl text-sm text-ivory-400">An easy way to revisit the family and friends you hold close.</p>
        </header>
        {error && <Alert kind="error" className="mb-6">We couldn&apos;t load your saved memorials. {error.message}</Alert>}
        {saved.length === 0 ? (
          <EmptyState
            title="Nothing saved yet"
            body="Use “Save” on any memorial and it will be kept here for you."
            action={
              <Link href="/map" className="btn-primary">
                Explore the Memorial Map
              </Link>
            }
          />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((s) => (
              <li key={s.id}>
                <MemorialCard
                  slug={s.slug}
                  name={s.full_name}
                  birthYear={s.birth_year}
                  deathYear={s.death_year}
                  epitaph={s.epitaph}
                  placeName={s.place_name}
                  profileImagePath={s.profile_image_path}
                  footer={<p className="text-xs text-ivory-500">Saved {timeAgo(s.saved_at)}</p>}
                  className="h-full"
                />
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}
