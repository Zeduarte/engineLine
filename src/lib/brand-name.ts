import { CAR_BRANDS } from "./car-brands";
import { MOTORCYCLE_BRANDS } from "./vehicle-categories";

/**
 * Grafia canónica da marca.
 *
 * O campo da marca aceita texto livre (há submarcas e importadores fora do
 * catálogo), e por isso "BMW", "Bmw" e "bmw" chegavam à base de dados como três
 * marcas diferentes: a pesquisa encontrava as três viaturas, mas o filtro de
 * marca partia-as em duas opções separadas.
 *
 * Aqui a marca escrita é comparada com o catálogo sem olhar a maiúsculas nem a
 * espaços; havendo correspondência, fica gravada na grafia do catálogo. O que
 * não estiver no catálogo é respeitado tal como foi escrito — o vendedor pode
 * ter uma razão para a grafia que usou.
 */

const INDEX = new Map<string, string>();
for (const brand of [...CAR_BRANDS, ...MOTORCYCLE_BRANDS]) {
  // O catálogo de carros vence em caso de nome repetido (BMW, Honda), o que é
  // indiferente: a grafia é a mesma nos dois.
  const key = normalizeKey(brand);
  if (!INDEX.has(key)) INDEX.set(key, brand);
}

/** Chave de comparação: minúsculas, sem espaços nem pontuação. */
function normalizeKey(raw: string): string {
  return raw.toLowerCase().replace(/[\s._-]+/g, "");
}

/** Devolve a grafia do catálogo, ou a original se a marca não for conhecida. */
export function canonicalBrand(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  return INDEX.get(normalizeKey(trimmed)) ?? trimmed;
}

/**
 * Agrupa marcas para um filtro: a chave é insensível a maiúsculas (para que
 * "BMW" e "Bmw" já gravados caiam na mesma opção) e o rótulo é a grafia
 * canónica quando a marca é conhecida.
 */
export function brandOptions(makes: string[]): string[] {
  const seen = new Map<string, string>();
  for (const m of makes) {
    const key = normalizeKey(m);
    if (!key) continue;
    if (!seen.has(key)) seen.set(key, canonicalBrand(m));
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, "pt"));
}

/** Duas marcas são a mesma? Usado pelos filtros, que comparam sem grafia. */
export function sameBrand(a: string, b: string): boolean {
  return normalizeKey(a) === normalizeKey(b);
}
