import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound, LogOut, LayoutDashboard } from "lucide-react";
import { getCurrentProfile } from "@/lib/supabase/server";
import { Footer } from "@/components/layout/Footer";
import { ProfileForm } from "@/components/account/ProfileForm";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Account", robots: { index: false, follow: false } };

export default async function AccountPage() {
  const { user, profile } = await getCurrentProfile();
  if (!user) redirect("/auth/sign-in?next=/account");

  return (
    <>
      <main className="container-page py-10 sm:py-14">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Account</p>
            <h1 className="mt-2 text-4xl text-ivory-50 sm:text-5xl">Your profile</h1>
          </div>
          <Link href="/dashboard" className="btn-ghost">
            <LayoutDashboard size={16} aria-hidden /> Dashboard
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <ProfileForm initial={{ display_name: profile?.display_name ?? "", bio: profile?.bio ?? null, avatar_path: profile?.avatar_path ?? null }} />

          <aside className="space-y-6">
            <section className="card p-6" aria-labelledby="signin-details">
              <h2 id="signin-details" className="text-2xl text-ivory-50">
                Sign-in details
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="label mb-0.5">Email</dt>
                  <dd className="break-all text-ivory-200">{user.email}</dd>
                </div>
                <div>
                  <dt className="label mb-0.5">Member since</dt>
                  <dd className="text-ivory-200">{formatDate(user.created_at)}</dd>
                </div>
              </dl>
              <Link href="/auth/forgot" className="btn-secondary mt-5 w-full">
                <KeyRound size={16} aria-hidden /> Change password
              </Link>
            </section>

            <section className="card p-6" aria-labelledby="session">
              <h2 id="session" className="text-2xl text-ivory-50">
                Session
              </h2>
              <p className="mt-2 text-sm text-ivory-400">Sign out on this device. Your memorials and saved places will be here when you return.</p>
              <form action="/auth/sign-out" method="post" className="mt-5">
                <button type="submit" className="btn-ghost w-full border border-white/10">
                  <LogOut size={16} aria-hidden /> Sign out
                </button>
              </form>
            </section>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
