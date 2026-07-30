"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/carros", label: "Viaturas", exact: false },
  { href: "/admin/carros/novo", label: "Nova viatura", exact: true },
  { href: "/admin/leads", label: "Leads", exact: false },
];

export function MobileNav({
  user,
  newLeads = 0,
}: {
  user: { name: string; role: string };
  newLeads?: number;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-soft/95 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/admin" className="text-base font-bold tracking-tight">
          engine<span className="text-accent">Line</span>
          <span className="ml-1 text-xs text-paper/50">Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Menu"
          className="rounded-lg border border-white/15 px-3 py-1.5 text-sm"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <nav className="border-t border-white/10 px-2 py-2">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm ${
                  active ? "bg-accent/15 text-accent" : "text-paper/80"
                }`}
              >
                {item.label}
                {item.href === "/admin/leads" && newLeads > 0 && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-ink">
                    {newLeads}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="mt-2 flex items-center justify-between border-t border-white/10 px-3 pt-3">
            <span className="text-xs text-paper/50">{user.name}</span>
            <form action={logout}>
              <button type="submit" className="text-xs text-paper/60">
                Terminar sessão
              </button>
            </form>
          </div>
        </nav>
      )}
    </header>
  );
}
