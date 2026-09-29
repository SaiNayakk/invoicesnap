"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, FileText, LayoutDashboard, LogOut, Plus, Settings, Users } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/invoices", icon: FileText, label: "Invoices" },
  { href: "/clients", icon: Users, label: "Clients" },
  { href: "/analytics", icon: BarChart3, label: "Reports" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

function useActive() {
  const path = usePathname();
  return (href: string) => (href === "/invoices" ? path === href || (path.startsWith("/invoices/") && path !== "/invoices/new") : path === href || path.startsWith(href + "/"));
}

export function Sidebar({ business, email, demo }: { business: string; email: string; demo: boolean }) {
  const active = useActive();
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(demo ? "/demo" : "/auth");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex sticky top-0 h-screen w-56 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 px-3 py-5">
      <Link href="/dashboard" className="px-2 mb-6"><Logo size={26} /></Link>
      <Link href="/invoices/new" className="mx-1 mb-5 flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-500 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors">
        <Plus size={15} /> New invoice
      </Link>
      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              active(href) ? "bg-zinc-800/80 text-zinc-50 font-medium" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100")}>
            <Icon size={16} className={active(href) ? "text-emerald-400" : "text-zinc-500"} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-zinc-800 pt-4">
        <div className="px-3 mb-2 min-w-0">
          <p className="truncate text-sm font-medium text-zinc-200">{business || "Your business"}</p>
          <p className="truncate text-xs text-zinc-500">{demo ? "Demo account" : email}</p>
        </div>
        {!demo && (
          <button onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200 transition-colors">
            <LogOut size={15} /> Sign out
          </button>
        )}
      </div>
    </aside>
  );
}

/** Phones: a slim top bar and a bottom tab bar with the primary action in the middle. */
export function MobileNav() {
  const active = useActive();
  const tabs = [NAV[0], NAV[1], null, NAV[2], NAV[4]];
  return (
    <>
      <header className="md:hidden sticky top-0 z-30 flex h-12 items-center border-b border-zinc-800 bg-zinc-950/95 px-4 backdrop-blur">
        <Link href="/dashboard" className="flex items-center gap-2"><LogoMark size={22} /><span className="font-display text-base font-semibold text-zinc-100">InvoiceSnap</span></Link>
      </header>
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-zinc-800 bg-zinc-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        {tabs.map((t) =>
          t ? (
            <Link key={t.href} href={t.href} className={cn("flex flex-col items-center gap-0.5 py-2 text-[10px]", active(t.href) ? "text-emerald-400" : "text-zinc-500")}>
              <t.icon size={18} />
              {t.label}
            </Link>
          ) : (
            <Link key="new" href="/invoices/new" aria-label="New invoice" className="flex items-center justify-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-zinc-950"><Plus size={20} /></span>
            </Link>
          ),
        )}
      </nav>
    </>
  );
}
