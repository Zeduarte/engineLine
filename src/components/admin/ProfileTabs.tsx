"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Separadores da área pessoal. "Pedidos" só existe para quem decide férias —
 * mostrar um separador vazio a quem não pode aprovar seria ruído.
 */
export function ProfileTabs({ canApprove }: { canApprove: boolean }) {
  const pathname = usePathname();
  const tabs = [
    { href: "/admin/perfil", label: "Dados", exact: true },
    { href: "/admin/perfil/ferias", label: "Férias", exact: false },
    { href: "/admin/perfil/colegas", label: "Férias colegas", exact: false },
    ...(canApprove
      ? [{ href: "/admin/perfil/pedidos", label: "Pedidos", exact: false }]
      : []),
  ];

  return (
    <nav aria-label="Área pessoal" className="flex gap-1 border-b border-white/10">
      {tabs.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm transition-colors ${
              active
                ? "border-accent font-medium text-accent"
                : "border-transparent text-paper/60 hover:text-paper"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
