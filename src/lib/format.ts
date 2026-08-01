/** Formatadores centralizados na convenção pt-PT (espaço como milhar, € à direita). */

const eur = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("pt-PT");

export function formatPrice(value: number): string {
  return eur.format(value);
}

/** Preço formatado, ou "Sob consulta" quando aplicável. */
export function priceLabel(
  value: number,
  onRequest?: boolean,
): string {
  if (onRequest || !value) return "Sob consulta";
  return eur.format(value);
}

export function formatKm(value: number): string {
  return `${number.format(value)} km`;
}

export function formatNumber(value: number): string {
  return number.format(value);
}
