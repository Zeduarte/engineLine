/**
 * Etiquetas dos cards das viaturas ("Nacional", "Novidade", "Poucos km", …).
 *
 * Há dois tipos:
 *  - automáticas: o site decide quando aparecem (estado, preço, km, data);
 *  - do stand: criadas em Definições e marcadas à mão na ficha da viatura.
 *
 * O texto, a cor e se aparecem ou não são editáveis em Definições → Etiquetas
 * (guardado em `site_content`, chave 'badges'). Funções puras: servem o site
 * público, o backoffice e os testes.
 */

export type AutoBadgeId = "reserved" | "sold" | "price_drop" | "national" | "new" | "low_km";

export interface BadgeDef {
  id: string;
  label: string;
  /** Cor de fundo, em hexadecimal (#rrggbb). */
  color: string;
  enabled: boolean;
  /** Automática (decidida pelo site) ou do stand (marcada na ficha). */
  auto: boolean;
}

/** Laranja da marca — a cor por defeito das etiquetas. */
export const BADGE_ORANGE = "#E67E22";

export const AUTO_BADGE_RULE: Record<AutoBadgeId, string> = {
  reserved: "Viatura reservada",
  sold: "Viatura vendida",
  price_drop: "Preço anterior maior do que o atual",
  national: "Viatura nacional",
  new: "Anunciada há 14 dias ou menos",
  low_km: "Menos de 30 000 km",
};

export const DEFAULT_BADGES: BadgeDef[] = [
  { id: "reserved", label: "Reservado", color: "#F59E0B", enabled: true, auto: true },
  { id: "sold", label: "Vendido", color: "#EF4444", enabled: true, auto: true },
  { id: "price_drop", label: "Baixa de preço", color: BADGE_ORANGE, enabled: true, auto: true },
  { id: "national", label: "Nacional", color: BADGE_ORANGE, enabled: true, auto: true },
  { id: "new", label: "Novidade", color: BADGE_ORANGE, enabled: true, auto: true },
  { id: "low_km", label: "Poucos km", color: BADGE_ORANGE, enabled: true, auto: true },
];

/** Cores rápidas no editor (qualquer outra pode ser escolhida à mão). */
export const BADGE_SWATCHES = [BADGE_ORANGE, "#EF4444", "#F59E0B", "#10B981", "#0EA5E9", "#8B5CF6", "#EC4899", "#F5F5F5", "#111111"];

const HEX = /^#[0-9a-fA-F]{6}$/;
const AUTO_IDS = new Set<string>(DEFAULT_BADGES.map((b) => b.id));
/** Quantas etiquetas no máximo por card — mais do que isto tapa a foto. */
export const MAX_CARD_BADGES = 3;

/**
 * Junta o que está guardado aos valores por defeito: as automáticas existem
 * sempre (pela ordem de fábrica), as do stand vêm a seguir. Valores inválidos
 * caem no defeito em vez de partirem os cards.
 */
export function mergeBadges(saved: unknown): BadgeDef[] {
  const list = Array.isArray((saved as { items?: unknown })?.items)
    ? ((saved as { items: unknown[] }).items as Partial<BadgeDef>[])
    : [];
  const byId = new Map(list.filter((b) => b && typeof b.id === "string").map((b) => [b.id!, b]));
  const clean = (b: Partial<BadgeDef> | undefined, base: BadgeDef): BadgeDef => ({
    id: base.id,
    label: typeof b?.label === "string" && b.label.trim() ? b.label.trim().slice(0, 30) : base.label,
    color: typeof b?.color === "string" && HEX.test(b.color) ? b.color.toUpperCase() : base.color,
    enabled: typeof b?.enabled === "boolean" ? b.enabled : base.enabled,
    auto: base.auto,
  });
  const autos = DEFAULT_BADGES.map((d) => clean(byId.get(d.id), d));
  const custom = list
    .filter((b) => b && typeof b.id === "string" && !AUTO_IDS.has(b.id) && typeof b.label === "string" && b.label.trim())
    .slice(0, 30)
    .map((b) => clean(b, { id: b.id!, label: b.label!, color: BADGE_ORANGE, enabled: true, auto: false }));
  return [...autos, ...custom];
}

/** Texto escuro ou claro, conforme o fundo, para se ler sempre. */
export function textOn(hex: string): string {
  if (!HEX.test(hex)) return "#0A0A0A";
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * lin(r!) + 0.7152 * lin(g!) + 0.0722 * lin(b!);
  // 0,25: o laranja da marca fica com texto escuro, como sempre esteve.
  return luminance > 0.25 ? "#0A0A0A" : "#FFFFFF";
}

export interface BadgeFacts {
  status?: string;
  price: number;
  previousPrice?: number | null;
  national?: boolean;
  createdAt?: string;
  mileage: number;
  /** Etiquetas do stand marcadas na ficha (ids). */
  customBadges?: string[];
}

/**
 * Etiquetas de uma viatura, já com cor: primeiro o estado, depois as do stand
 * e por fim as automáticas — no máximo três.
 */
export function badgesFor(
  v: BadgeFacts,
  defs: BadgeDef[],
  now = Date.now(),
): { id: string; label: string; color: string; text: string }[] {
  const on = new Map(defs.filter((d) => d.enabled).map((d) => [d.id, d]));
  const ids: string[] = [];
  if (v.status === "reserved") ids.push("reserved");
  if (v.status === "sold") ids.push("sold");
  for (const id of v.customBadges ?? []) if (!AUTO_IDS.has(id)) ids.push(id);
  if (v.previousPrice != null && v.price > 0 && v.previousPrice > v.price) ids.push("price_drop");
  if (v.national) ids.push("national");
  if (v.createdAt && (now - new Date(v.createdAt).getTime()) / 86_400_000 <= 14) ids.push("new");
  if (v.mileage > 0 && v.mileage < 30_000) ids.push("low_km");
  return ids
    .map((id) => on.get(id))
    .filter((d): d is BadgeDef => !!d)
    .slice(0, MAX_CARD_BADGES)
    .map((d) => ({ id: d.id, label: d.label, color: d.color, text: textOn(d.color) }));
}

/** Id para uma etiqueta nova do stand ("IVA dedutível" → "iva-dedutivel-x7k2"). */
export function newBadgeId(label: string, rand = Math.random()): string {
  const slug = label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24) || "etiqueta";
  return `${slug}-${Math.floor(rand * 36 ** 4).toString(36).padStart(4, "0")}`;
}
