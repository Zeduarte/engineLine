"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { internalNavigationTarget } from "@/lib/nav-click";
import { NAV_START_EVENT, pageTransition } from "@/lib/page-transition";

/** Nome da foto partilhada entre o cartão clicado e a galeria da ficha. */
const MEDIA_NAME = "vehicle-media";
/** Sem resposta do servidor neste tempo, a navegação segue sem animação. */
const MAX_WAIT_MS = 1500;

/**
 * Transições entre páginas com a View Transitions API do browser.
 *
 * No clique num link interno tiramos uma "fotografia" da página atual, o
 * router do Next troca de rota e o browser anima entre as duas: a página
 * antiga desvanece a subir, a nova entra de baixo (CSS em globals.css). Ao
 * abrir uma viatura a partir de um cartão, a foto do cartão expande-se até à
 * galeria da ficha (elementos `[data-vt-media]` → `[data-vt-target]`).
 *
 * Os nomes de transição só existem durante a navegação: com dezenas de
 * cartões na página, nomeá-los todos obrigava o browser a capturar cada um.
 *
 * Browsers sem a API, ou com "reduzir movimento", navegam normalmente (o
 * `template.tsx` faz então um fade simples).
 */
export function PageTransitions() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pending = useRef<{ resolve: () => void; shared: boolean } | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const url = internalNavigationTarget(e);
      if (!url) return;
      window.dispatchEvent(new Event(NAV_START_EVENT));
      // O backoffice tem outro layout raiz: o Next faz um carregamento
      // completo, sem nada para animar.
      if (!canAnimate() || url.pathname.startsWith("/admin")) return;

      // Fase de captura: corre antes do <Link>, que ao ver o clique
      // cancelado deixa a navegação connosco.
      e.preventDefault();

      const anchor = (e.target as Element).closest("a");
      const media = anchor?.querySelector<HTMLElement>("[data-vt-media]");
      if (media) media.style.viewTransitionName = MEDIA_NAME;

      pageTransition.active = true;
      const transition = document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            const timer = window.setTimeout(() => {
              pending.current = null;
              resolve();
              transition.skipTransition();
            }, MAX_WAIT_MS);
            pending.current = {
              shared: !!media,
              resolve: () => {
                window.clearTimeout(timer);
                resolve();
              },
            };
            router.push(url.pathname + url.search + url.hash);
          }),
      );

      transition.finished.finally(() => {
        pageTransition.active = false;
        if (media) media.style.viewTransitionName = "";
        document
          .querySelectorAll<HTMLElement>("[data-vt-target]")
          .forEach((el) => (el.style.viewTransitionName = ""));
      });
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  // A rota nova foi aplicada ao DOM: o browser pode capturar o estado final.
  useLayoutEffect(() => {
    const current = pending.current;
    if (!current) return;
    pending.current = null;
    if (current.shared) {
      const target = document.querySelector<HTMLElement>("[data-vt-target]");
      if (target) target.style.viewTransitionName = MEDIA_NAME;
    }
    current.resolve();
  }, [pathname, searchParams]);

  return null;
}

function canAnimate() {
  return (
    typeof document.startViewTransition === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
