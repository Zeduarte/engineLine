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

export function formatKm(value: number): string {
  return `${number.format(value)} km`;
}

export function formatNumber(value: number): string {
  return number.format(value);
}
