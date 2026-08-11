"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "▨", exact: true, adminOnly: false },
  { href: "/admin/carros", label: "Viaturas", icon: "▦", exact: false, adminOnly: false },
  { href: "/admin/carros/novo", label: "Nova viatura", icon: "＋", exact: true, adminOnly: false },
  { href: "/admin/pagina-inicial", label: "Página inicial", icon: "◧", exact: false, adminOnly: false },
  { href: "/admin/leads", label: "Leads", icon: "✉", exact: false, adminOnly: false },
  { href: "/admin/testemunhos", label: "Testemunhos", icon: "★", exact: false, adminOnly: false },
  { href: "/admin/utilizadores", label: "Utilizadores", icon: "◑", exact: false, adminOnly: true },
  { href: "/admin/definicoes", label: "Definições", icon: "⚙", exact: false, adminOnly: true },
];

export function Sidebar({
  user,
  companyName = "engineLine",
  newLeads = 0,
}: {
  user: { name: string; role: string };
  companyName?: string;
  newLeads?: number;
}) {
  const pathname = usePathname();
  const isAdmin = user.role === "admin";
  const items = NAV.filter((i) => !i.adminOnly || isAdmin);

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="flex h-full flex-col gap-6 border-r border-white/10 bg-ink-soft p-5">
      <Link href="/admin" className="flex items-center gap-2 px-2">
        <span className="truncate text-lg font-bold tracking-tight text-paper">
          {companyName}
        </span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-paper/60">
          Admin
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-accent/15 font-medium text-accent"
                  : "text-paper/70 hover:bg-white/5 hover:text-paper"
              }`}
            >
              <span className="flex items-center gap-3">
                <span aria-hidden className="w-4 text-center">
                  {item.icon}
                </span>
                {item.label}
              </span>
              {item.href === "/admin/leads" && newLeads > 0 && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-ink">
                  {newLeads}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 pt-4">
        <div className="mb-3 px-2">
          <p className="truncate text-sm font-medium text-paper">{user.name}</p>
          <p className="text-xs capitalize text-paper/50">{user.role}</p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="mb-1 block rounded-lg px-2 py-2 text-xs text-paper/60 transition-colors hover:text-paper"
        >
          ↗ Ver site público
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-lg px-2 py-2 text-left text-xs text-paper/60 transition-colors hover:text-red-300"
          >
            ⏻ Terminar sessão
          </button>
        </form>
      </div>
    </aside>
  );
}
