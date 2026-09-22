import Link from "next/link";
import { getCurrentProfile } from "@/lib/supabase/server";
import { SITE_NAME } from "@/lib/site";
import { HeaderNav } from "./HeaderNav";

export async function Header() {
  const { user, profile } = await getCurrentProfile();
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-navy-900/70 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 text-ivory-50" aria-label={`${SITE_NAME} home`}>
          <span className="relative inline-flex h-7 w-7 items-center justify-center" aria-hidden>
            <span className="absolute inset-0 rounded-full border border-gold-400/50" />
            <span className="h-2.5 w-2.5 rounded-full bg-gold-400 shadow-[0_0_12px_rgb(211_184_119/0.8)]" />
          </span>
          <span className="font-display text-xl tracking-wide">{SITE_NAME}</span>
        </Link>
        <HeaderNav
          user={user ? { email: user.email ?? "" } : null}
          profile={profile ? { display_name: profile.display_name, avatar_path: profile.avatar_path, is_admin: profile.is_admin } : null}
        />
      </div>
    </header>
  );
}
