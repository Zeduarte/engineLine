import { normalize } from "@/lib/whatsapp/confirm";

/**
 * Escolher a categoria do OLX para carros e para motas.
 *
 * Os IDs não estão na documentação e variam por país. Procura-se pelo nome:
 * primeiro uma categoria final (`is_leaf`) que encaixe; se não houver, uma que
 * encaixe mesmo tendo subcategorias. Com várias, ou nenhuma, o administrador
 * escolhe no painel entre as categorias de veículos encontradas. Publicar
 * carros na categoria errada faria os anúncios desaparecerem das pesquisas.
 */

export interface OlxCategory {
  id: number;
  name: string;
  parent_id?: number | null;
  photos_limit?: number;
  is_leaf?: boolean;
}

/** Peças, acessórios, equipamento: nunca são a categoria da viatura. */
const NOT_VEHICLE = /\b(peca|pecas|acessorio|acessorios|equipamento|vestuario|pneus|jantes|outros)\b/;

const MATCHERS: Record<"car" | "motorcycle", (n: string) => boolean> = {
  car: (n) => /^(carros|automoveis|ligeiros)\b/.test(n) && !/\bmoto/.test(n.replace(/^carros\b/, "")),
  motorcycle: (n) => /^(motos|motas|motociclos|motociclo|motorizadas)\b/.test(n),
};

/** Categorias que parecem ser de veículos (para o administrador escolher). */
export function isVehicleCategory(c: OlxCategory): boolean {
  const n = normalize(c.name);
  return /carro|moto|automove|veicul|scooter|ligeiro/.test(n) && !NOT_VEHICLE.test(n);
}

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
  const matching = categories.filter((c) => {
    const n = normalize(c.name);
    return MATCHERS[vehicleType](n) && !NOT_VEHICLE.test(n);
  });
  // Sem repetidos (a mesma categoria pode vir em dois níveis da árvore).
  const unique = [...new Map(matching.map((c) => [c.id, c])).values()];
  const leaves = unique.filter((c) => c.is_leaf !== false);
  return leaves.length ? leaves : unique;
}
