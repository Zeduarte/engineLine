/**
 * Papéis e permissões do backoffice.
 *
 * Hierarquia: admin (3) > chefe (2) > vendedor (1).
 *  - Quem tem rank MAIOR pode gerir (editar papel + acessos) quem tem rank
 *    menor. Nunca se pode gerir alguém de rank igual ou superior.
 *  - Cada utilizador tem acesso a um conjunto de "separadores" (sections). O
 *    admin vê sempre todos. Para chefe/vendedor, os acessos vêm de
 *    `allowed_sections` (configurável por um superior) ou, se estiver vazio,
 *    dos defaults do papel.
 *  - Um gestor só pode conceder separadores a que ele próprio tem acesso.
 */

export type Role = "admin" | "chefe" | "vendedor" | "mecanico";

export type Section =
  | "dashboard"
  | "carros"
  | "pagina-inicial"
  | "leads"
  | "testemunhos"
  | "integracoes"
  | "utilizadores"
  | "definicoes"
  | "oficina";

export const ROLE_RANK: Record<Role, number> = {
  admin: 3,
  chefe: 2,
  vendedor: 1,
  // O mecânico está fora da hierarquia comercial; rank 1 (gerível pelo admin).
  mecanico: 1,
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador",
  chefe: "Chefe",
  vendedor: "Vendedor",
  mecanico: "Mecânico",
};

/** Separadores do backoffice (ordem do menu). */
export const SECTIONS: {
  key: Section;
  label: string;
  href: string;
  exact: boolean;
}[] = [
  { key: "dashboard", label: "Dashboard", href: "/admin", exact: true },
  { key: "carros", label: "Viaturas", href: "/admin/carros", exact: false },
  { key: "pagina-inicial", label: "Página inicial", href: "/admin/pagina-inicial", exact: false },
  { key: "leads", label: "Leads", href: "/admin/leads", exact: false },
  { key: "testemunhos", label: "Testemunhos", href: "/admin/testemunhos", exact: false },
  { key: "integracoes", label: "Integrações", href: "/admin/integracoes", exact: false },
  { key: "utilizadores", label: "Utilizadores", href: "/admin/utilizadores", exact: false },
  { key: "definicoes", label: "Definições", href: "/admin/definicoes", exact: false },
  { key: "oficina", label: "Oficina", href: "/admin/oficina", exact: false },
];

export const ALL_SECTIONS: Section[] = SECTIONS.map((s) => s.key);

/** Acessos por defeito de cada papel (quando `allowed_sections` está vazio). */
export const DEFAULT_SECTIONS: Record<Role, Section[]> = {
  admin: ALL_SECTIONS,
  chefe: ["dashboard", "carros", "pagina-inicial", "leads", "testemunhos"],
  vendedor: ["dashboard", "carros", "leads"],
  // O mecânico só tem a Oficina — nada de dashboard/leads/etc.
  mecanico: ["oficina"],
};

function isRole(x: string): x is Role {
  return (
    x === "admin" || x === "chefe" || x === "vendedor" || x === "mecanico"
  );
}

/** O Dashboard está sempre acessível (evita bloqueios/loops de redireção). */
export const ALWAYS: Section = "dashboard";

/** Separadores efetivos de um utilizador. Admin → todos. */
export function effectiveSections(
  role: string,
  allowed?: string[] | null,
): Section[] {
  if (role === "admin") return ALL_SECTIONS;
  // O mecânico é um caso especial: só a Oficina, sem forçar o dashboard.
  if (role === "mecanico") return ["oficina"];
  const r: Role = isRole(role) ? role : "vendedor";
  const base =
    allowed && allowed.length
      ? ALL_SECTIONS.filter((s) => allowed.includes(s))
      : DEFAULT_SECTIONS[r];
  return base.includes(ALWAYS) ? base : [ALWAYS, ...base];
}

/** O utilizador tem acesso a um separador? */
export function canAccess(
  role: string,
  allowed: string[] | null | undefined,
  section: Section,
): boolean {
  return effectiveSections(role, allowed).includes(section);
}

/** `manager` pode gerir (editar) `target`? (rank estritamente superior). */
export function canManage(managerRole: string, targetRole: string): boolean {
  const m = isRole(managerRole) ? ROLE_RANK[managerRole] : 0;
  const t = isRole(targetRole) ? ROLE_RANK[targetRole] : 0;
  return m > t;
}

/**
 * Papéis que um gestor pode atribuir. O admin pode atribuir qualquer papel
 * (incluindo admin); os restantes só papéis de rank inferior ao seu.
 */
export function assignableRoles(managerRole: string): Role[] {
  if (managerRole === "admin")
    return ["admin", "chefe", "vendedor", "mecanico"];
  const m = isRole(managerRole) ? ROLE_RANK[managerRole] : 0;
  // O mecânico não é atribuível por não-admins (fora da hierarquia comercial).
  return (["admin", "chefe", "vendedor"] as Role[]).filter(
    (r) => ROLE_RANK[r] < m,
  );
}
