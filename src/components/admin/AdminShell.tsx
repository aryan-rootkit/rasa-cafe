"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ExternalLink,
  Images,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  Settings,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/settings", label: "Website Settings", icon: Settings },
  { href: "/admin/hero", label: "Hero Images", icon: Images },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminShell({
  username,
  children,
}: {
  username: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    router.replace("/admin/login");
    router.refresh();
  }

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-4">
      <div className="mb-6 flex items-center justify-between px-2">
        <div>
          <p className="font-serif text-2xl tracking-[0.14em]">RASA</p>
          <p className="text-xs text-stone-500">Admin · {username}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md p-2 text-stone-500 hover:bg-stone-100 lg:hidden"
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
      </div>

      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              active
                ? "bg-stone-900 text-white"
                : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}

      <div className="mt-auto space-y-1 border-t border-stone-200 pt-4">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-stone-600 hover:bg-stone-100 hover:text-stone-900"
        >
          <ExternalLink size={18} />
          View website
        </a>
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-stone-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
        >
          <LogOut size={18} />
          {loggingOut ? "Signing out…" : "Logout"}
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-stone-200 bg-white lg:block">
        {sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-stone-900/30"
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md p-2 hover:bg-stone-100"
            aria-label="Open navigation"
          >
            <MenuIcon size={20} />
          </button>
          <p className="font-serif text-xl tracking-[0.14em]">RASA</p>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
