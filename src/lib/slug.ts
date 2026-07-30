/** Gera um slug URL-safe a partir de texto (remove acentos, espaços → hífen). */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove diacríticos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/** Slug base de uma viatura: marca-modelo-ano. */
export function vehicleSlug(make: string, model: string, year: number): string {
  return slugify(`${make} ${model} ${year}`);
}
