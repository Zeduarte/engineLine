/**
 * Prefixa caminhos de assets estáticos em `/public` com o `basePath`.
 *
 * O `next/link`, `next/image` e `next/font` já aplicam o `basePath`
 * automaticamente. Mas caminhos absolutos em bruto (ex.: `src` de `<video>`,
 * `<source>` e `poster`) NÃO são reescritos pelo Next — daí este helper. Em
 * desenvolvimento e nos hosts em raiz, `NEXT_PUBLIC_BASE_PATH` é vazio e a
 * função devolve o caminho tal como está.
 */
export function asset(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${base}${path}`;
}
