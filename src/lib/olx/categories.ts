import { normalize } from "@/lib/whatsapp/confirm";

/**
 * Escolher a categoria do OLX para carros e para motas.
 *
 * Os IDs não estão na documentação e variam por país. Procura-se pelo nome e
 * só se aceita quando há UMA categoria final (`is_leaf`) que encaixa; com
 * várias, o administrador escolhe no painel. Publicar carros na categoria
 * errada faria os anúncios desaparecerem das pesquisas.
 */

export interface OlxCategory {
  id: number;
  name: string;
  parent_id?: number | null;
  photos_limit?: number;
  is_leaf?: boolean;
}

const MATCHERS: Record<"car" | "motorcycle", (n: string) => boolean> = {
  car: (n) => n === "carros" || n === "automoveis" || n === "carros usados",
  motorcycle: (n) => /^(motos|motociclos|motociclos e scooters|motas)$/.test(n),
};

/** A API devolve às vezes a lista direta e às vezes dentro de `data`. */
export function unwrap<T>(body: unknown): T {
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

export function categoryCandidates(
  categories: OlxCategory[],
  vehicleType: "car" | "motorcycle",
): OlxCategory[] {
  return categories.filter(
    (c) => c.is_leaf !== false && MATCHERS[vehicleType](normalize(c.name)),
  );
}
