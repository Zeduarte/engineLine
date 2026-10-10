/**
 * Deteta se um clique vai provocar uma navegação interna do Next (um `<Link>`
 * ou `<a>` para outra rota do mesmo site). Usado pelas transições de página,
 * que o intercetam na fase de captura — antes dos handlers do React.
 *
 * Ignora: cliques com modificadores (abrir noutro separador), botões que não o
 * principal, `target="_blank"`, `download`, outros domínios, `mailto:`/`tel:`,
 * ficheiros e `/api`,
 * cliques já cancelados, botões dentro do link (setas de fotos, favorito e
 * comparar dentro de um cartão — que cancelam a navegação nos seus handlers)
 * e links só de âncora na mesma página.
 */
export function internalNavigationTarget(e: MouseEvent): URL | null {
  if (e.defaultPrevented || e.button !== 0) return null;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;

  const anchor = (e.target as Element | null)?.closest?.("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  if (anchor.target && anchor.target !== "_self") return null;
  if (anchor.hasAttribute("download")) return null;

  const control = (e.target as Element).closest(
    "button, input, select, textarea, label",
  );
  if (control && anchor.contains(control)) return null;

  let url: URL;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return null;
  }
  if (url.origin !== window.location.origin) return null;
  // Ficheiros (PDF, feeds…) e API não são páginas do router.
  if (url.pathname.startsWith("/api/")) return null;
  if (/\.[a-z0-9]{2,5}$/i.test(url.pathname)) return null;

  const here = window.location;
  if (url.pathname === here.pathname && url.search === here.search) return null;

  return url;
}
