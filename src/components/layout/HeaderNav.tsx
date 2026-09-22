"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X, Search, Map as MapIcon, Plus, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

type Props = {
  user: { email: string } | null;
  profile: { display_name: string; avatar_path: string | null; is_admin: boolean } | null;
};

export function HeaderNav({ user, profile }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
    setMenu(false);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const links = [
    { href: "/map", label: "Memorial Map", icon: MapIcon },
    { href: "/search", label: "Search", icon: Search },
  ];
  const name = profile?.display_name || user?.email || "Account";

  return (
    <>
      <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={cn("btn-ghost px-4", pathname.startsWith(l.href) && "text-gold-300")}>
            {l.label}
          </Link>
        ))}
        <Link href="/create" className="btn-primary ml-2 px-4">
          <Plus size={16} /> Create a Memorial
        </Link>
        {user ? (
          <div className="relative ml-2" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenu((m) => !m)}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-white/8"
              aria-haspopup="menu"
              aria-expanded={menu}
            >
              <Avatar path={profile?.avatar_path} name={name} size={32} />
              <ChevronDown size={14} className="text-ivory-400" />
            </button>
            {menu && (
              <div role="menu" className="card absolute right-0 mt-2 w-56 overflow-hidden p-1.5 animate-fade-in">
                <p className="truncate px-3 py-2 text-xs text-ivory-500">{name}</p>
                {[
                  ["/dashboard", "Dashboard"],
                  ["/saved", "Saved memorials"],
                  ["/account", "Account"],
                  ...(profile?.is_admin ? [["/admin", "Admin"]] : []),
                ].map(([href, label]) => (
                  <Link key={href} href={href} role="menuitem" className="block rounded-lg px-3 py-2 text-sm text-ivory-200 hover:bg-white/8">
                    {label}
                  </Link>
                ))}
                <form action="/auth/sign-out" method="post">
                  <button type="submit" role="menuitem" className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ivory-400 hover:bg-white/8">
                    Sign out
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <Link href="/auth/sign-in" className="btn-ghost ml-1 px-4">
            Sign in
          </Link>
        )}
      </nav>

      <button type="button" className="btn-ghost p-2 md:hidden" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
        <Menu size={22} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-navy-950/95 p-6 backdrop-blur md:hidden animate-fade-in" role="dialog" aria-modal="true">
          <div className="flex items-center justify-between">
            <span className="font-display text-xl">Menu</span>
            <button type="button" className="btn-ghost p-2" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X size={22} />
            </button>
          </div>
          <div className="mt-8 flex flex-col gap-2 text-lg">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="rounded-xl px-4 py-3 hover:bg-white/8">
                {l.label}
              </Link>
            ))}
            <Link href="/create" className="rounded-xl px-4 py-3 text-gold-300 hover:bg-white/8">
              Create a Memorial
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="rounded-xl px-4 py-3 hover:bg-white/8">Dashboard</Link>
                <Link href="/saved" className="rounded-xl px-4 py-3 hover:bg-white/8">Saved memorials</Link>
                <Link href="/account" className="rounded-xl px-4 py-3 hover:bg-white/8">Account</Link>
                {profile?.is_admin && <Link href="/admin" className="rounded-xl px-4 py-3 hover:bg-white/8">Admin</Link>}
                <form action="/auth/sign-out" method="post">
                  <button type="submit" className="w-full rounded-xl px-4 py-3 text-left text-ivory-400 hover:bg-white/8">Sign out</button>
                </form>
              </>
            ) : (
              <Link href="/auth/sign-in" className="rounded-xl px-4 py-3 hover:bg-white/8">Sign in</Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
