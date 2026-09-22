import type { VehicleType } from "@/lib/vehicle-categories";
import type { Section } from "@/lib/permissions";

/**
 * Carros e motas são dois "mundos" com stock separado — mas nem tudo se
 * separa. Este módulo diz onde o mundo importa e onde é conteúdo comum, para
 * o seletor não aparecer em páginas onde não significa nada.
 */

/** Páginas públicas iguais nos dois mundos (institucional e legal). */
export const COMMON_PUBLIC_PATHS = [
  "/sobre",
  "/servicos",
  "/contactos",
  "/politica-de-cookies",
  "/politica-de-privacidade",
  "/termos-condicoes",
] as const;

/**
 * Separadores do backoffice que gerem o site inteiro, não um tipo de viatura:
 * testemunhos e utilizadores (pedido do cliente), mais definições e
 * integrações, que são configuração global.
 */
export const COMMON_ADMIN_SECTIONS: Section[] = [
  "testemunhos",
  "utilizadores",
  "definicoes",
  "integracoes",
];

/**
 * A área pessoal (dados e férias) não é um separador de permissões — está
 * fora de `Section` —, por isso tem de ser tratada à parte.
 */
const COMMON_ADMIN_PATHS = ["perfil"];

/** O mundo influencia o que esta página pública mostra? */
export function pathHasWorld(pathname: string): boolean {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return !COMMON_PUBLIC_PATHS.some(
    (p) => clean === p || clean.startsWith(`${p}/`),
  );
}

/** O mundo influencia este ecrã do backoffice? */
export function adminPathHasWorld(pathname: string): boolean {
  const section = pathname.split("/")[2] ?? "";
  if (COMMON_ADMIN_PATHS.includes(section)) return false;
  return !COMMON_ADMIN_SECTIONS.includes(section as Section);
}

export const WORLD_LABEL: Record<VehicleType, string> = {
  car: "carros",
  motorcycle: "motas",
};

/** O outro mundo — é para lá que o seletor aponta. */
export function otherWorld(type: VehicleType): VehicleType {
  return type === "car" ? "motorcycle" : "car";
}
