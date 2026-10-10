/**
 * Deteta se um clique vai provocar uma navegação interna do Next (um `<Link>`
 * ou `<a>` para outra rota do mesmo site). Usado pela barra de progresso de
 * navegação para arrancar logo no clique.
 *
 * Ignora: cliques com modificadores (abrir noutro separador), botões que não o
 * principal, `target="_blank"`, `download`, outros domínios, `mailto:`/`tel:`,
 * cliques já cancelados (`preventDefault` — ex.: setas de fotos dentro de um
 * card) e links só de âncora na mesma página.
 */
export function internalNavigationTarget(e: MouseEvent): URL | null {
  if (e.defaultPrevented || e.button !== 0) return null;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;

  const anchor = (e.target as Element | null)?.closest?.("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  if (anchor.target && anchor.target !== "_self") return null;
  if (anchor.hasAttribute("download")) return null;

  let url: URL;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return null;
  }
  if (url.origin !== window.location.origin) return null;

  const here = window.location;
  if (url.pathname === here.pathname && url.search === here.search) return null;

  return url;
}
