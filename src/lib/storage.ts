/** Utilitários do Supabase Storage (bucket público `car-media`). */

export const MEDIA_BUCKET = "car-media";

/**
 * Resolve o URL público de um objeto do Storage.
 *
 * Aceita tanto um `storage_path` (relativo ao bucket) como um URL absoluto
 * (usado no seed com imagens externas) — devolvendo-o inalterado nesse caso.
 */
export function publicMediaUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${pathOrUrl}`;
}
