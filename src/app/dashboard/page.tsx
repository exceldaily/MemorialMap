import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Users, ArrowRight, Bookmark, UserRound, CreditCard } from "lucide-react";
import { getCurrentProfile } from "@/lib/supabase/server";
import type { DashboardData, Plan } from "@/lib/supabase/types";
import { Footer } from "@/components/layout/Footer";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { MemorialCard } from "@/components/cards/MemorialCard";
import { DashboardTabs, isDashboardTab, type DashboardTab } from "@/components/dashboard/DashboardTabs";
import { MemorialManageCard } from "@/components/dashboard/MemorialManageCard";
import { PendingMemories } from "@/components/dashboard/PendingMemories";
import { PlanComparison, planFeatures } from "@/components/billing/PlanComparison";
import { timeAgo } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };

const EMPTY: DashboardData = { plan: "free", limits: {}, memorials: [], family_groups: [], pending_memories: [], saved: [] };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab: rawTab } = await searchParams;
  const tab: DashboardTab = isDashboardTab(rawTab) ? rawTab : "memorials";
  const { supabase, user, profile } = await getCurrentProfile();
  if (!user) redirect("/auth/sign-in?next=/dashboard");

  const { data: dash, error } = await supabase.rpc("my_dashboard");
  const data: DashboardData = {
    plan: dash?.plan ?? EMPTY.plan,
    limits: dash?.limits ?? EMPTY.limits,
    memorials: dash?.memorials ?? [],
    family_groups: dash?.family_groups ?? [],
    pending_memories: dash?.pending_memories ?? [],
    saved: dash?.saved ?? [],
  };

  let plans: Plan[] = [];
  if (tab === "billing") {
    const { data: rows } = await supabase.from("plans").select("*").eq("is_active", true).order("sort_order", { ascending: true });
    plans = rows ?? [];
  }

  const counts = {
    memorials: data.memorials.length,
    family: data.family_groups.length,
    pending: data.pending_memories.length,
    saved: data.saved.length,
  };

  return (
    <>
      <main className="container-page py-10 sm:py-14">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1 className="mt-2 text-4xl text-ivory-50 sm:text-5xl">Welcome back{profile?.display_name ? `, ${profile.display_name.split(" ")[0]}` : ""}</h1>
            <p className="mt-2 text-sm text-ivory-400">The memorials you care for, the memories waiting for you, and the places you have saved.</p>
          </div>
          <Link href="/create" className="btn-primary">
            <Plus size={16} aria-hidden /> Create a Memorial
          </Link>
        </header>

        <DashboardTabs active={tab} counts={counts} />

        {error && (
          <Alert kind="error" className="mt-6">
            We couldn&apos;t load your dashboard right now. {error.message}
          </Alert>
        )}

        <section className="mt-8 animate-fade-in" aria-live="polite">
          {tab === "memorials" && <MemorialsTab data={data} />}
          {tab === "family" && <FamilyTab data={data} />}
          {tab === "pending" && (
            <>
              <SectionHeading title="Memories awaiting approval" body="Memories shared by visitors are held here until you approve them. Only approved memories are shown on the memorial." />
              <PendingMemories items={data.pending_memories} />
            </>
          )}
          {tab === "saved" && <SavedTab data={data} />}
          {tab === "account" && (
            <>
              <SectionHeading title="Account" body="Your profile is shown alongside the memories and memorials you contribute." />
              <div className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
                <Avatar path={profile?.avatar_path} name={profile?.display_name || user.email || "You"} size={72} />
                <div className="min-w-0 flex-1">
                  <p className="text-2xl text-ivory-50">{profile?.display_name || "Add your name"}</p>
                  <p className="truncate text-sm text-ivory-400">{user.email}</p>
                  {profile?.bio && <p className="mt-2 text-sm text-ivory-300">{profile.bio}</p>}
                </div>
                <Link href="/account" className="btn-secondary">
                  <UserRound size={16} aria-hidden /> Edit profile
                </Link>
              </div>
            </>
          )}
          {tab === "billing" && <BillingTab data={data} plans={plans} />}
        </section>
      </main>
      <Footer />
    </>
  );
}

function SectionHeading({ title, body }: { title: string; body?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-3xl text-ivory-50">{title}</h2>
      {body && <p className="mt-1 max-w-2xl text-sm text-ivory-400">{body}</p>}
    </div>
  );
}

function MemorialsTab({ data }: { data: DashboardData }) {
  if (data.memorials.length === 0) {
    return (
      <EmptyState
        title="No memorials yet"
        body="Choose a place in the world and create a memorial for someone you love. It only takes a few minutes, and you can add to it over time."
        action={
          <Link href="/create" className="btn-primary">
            <Plus size={16} aria-hidden /> Create a Memorial
          </Link>
        }
      />
    );
  }
  return (
    <>
      <SectionHeading title="My memorials" body="Memorials you own or help care for." />
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.memorials.map((m) => (
          <li key={m.id}>
            <MemorialManageCard m={m} />
          </li>
        ))}
      </ul>
    </>
  );
}

function FamilyTab({ data }: { data: DashboardData }) {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          title="Family memorials"
          body="A family group brings memorials together on one landing page, and lets you reserve memorial locations near each other so the family can rest together on the map."
        />
        <Link href="/family/new" className="btn-secondary">
          <Users size={16} aria-hidden /> Create a family group
        </Link>
      </div>
      {data.family_groups.length === 0 ? (
        <EmptyState
          title="No family groups yet"
          body="Create a family group to connect memorials, share a gallery and keep a family's memorial locations close together."
          action={
            <Link href="/family/new" className="btn-primary">
              <Users size={16} aria-hidden /> Create a family group
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2">
          {data.family_groups.map((g) => (
            <li key={g.id}>
              <Link href={`/family/${g.slug}`} className="card group flex h-full flex-col p-6 transition-colors hover:border-gold-400/30">
                <h3 className="text-2xl text-ivory-50">{g.name}</h3>
                {g.description && <p className="mt-2 text-sm text-ivory-400">{g.description}</p>}
                <p className="mt-auto flex items-center justify-between pt-5 text-sm text-ivory-300">
                  <span>
                    {g.memorial_count} {g.memorial_count === 1 ? "memorial" : "memorials"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-gold-300">
                    Visit <ArrowRight size={14} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function SavedTab({ data }: { data: DashboardData }) {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <SectionHeading title="Saved memorials" body="Places you want to return to." />
        <Link href="/saved" className="btn-ghost">
          <Bookmark size={16} aria-hidden /> Open saved list
        </Link>
      </div>
      {data.saved.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          body="When you save a memorial, it will be kept here so you can revisit it easily."
          action={
            <Link href="/map" className="btn-primary">
              Explore the map
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.saved.map((s) => (
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
    </>
  );
}

function BillingTab({ data, plans }: { data: DashboardData; plans: Plan[] }) {
  const current = plans.find((p) => p.code === data.plan);
  const features = planFeatures(data.limits);
  return (
    <>
      <SectionHeading title="Billing" body="Everything is free while we grow. Plans are shown so you know what is coming; no payment is required today." />
      <div className="card mb-8 flex flex-col gap-5 p-6 sm:flex-row sm:items-start">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold-400/40 bg-gold-400/10 text-gold-300" aria-hidden>
          <CreditCard size={20} />
        </span>
        <div className="flex-1">
          <p className="eyebrow">Current plan</p>
          <p className="mt-1 text-3xl text-ivory-50">{current?.name ?? data.plan.replace(/^\w/, (c) => c.toUpperCase())}</p>
          {current?.description && <p className="mt-1 text-sm text-ivory-400">{current.description}</p>}
          {features.length > 0 && (
            <ul className="mt-4 grid gap-1.5 text-sm text-ivory-300 sm:grid-cols-2">
              {features.map((f) => (
                <li key={f.key}>
                  <span className="text-ivory-500">{f.label}:</span> {f.value}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <Alert kind="warning" className="mb-6">
        Coming soon — no payment required today. Upgrades will be available once plans launch.
      </Alert>
      <PlanComparison plans={plans} currentPlan={data.plan} />
    </>
  );
}
