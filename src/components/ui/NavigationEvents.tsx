"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { internalNavigationTarget } from "@/lib/nav-click";
import { ScrollTrigger } from "@/lib/gsap";
import {
  NAV_START_EVENT,
  navDirection,
  type NavStartDetail,
} from "@/lib/page-transition";

/** Sem a página nova neste tempo, os estados de "a abrir" são limpos. */
const SAFETY_MS = 8000;

/**
 * Estado de navegação partilhado com o listener de `popstate`, que vive ao
 * nível do módulo (ver abaixo). Só existe um `NavigationEvents` montado.
 */
const nav = {
  /** Rota e chave (rota + query) da página mostrada agora. */
  pathname: "",
  key: "",
  /** Scroll a repor quando a página do "voltar"/"avançar" for aplicada. */
  restoreTo: null as number | null,
  /** Chamado quando a rota nova é aplicada ao DOM (fim do "voltar"). */
  onCommit: null as (() => void) | null,
};
/** Sem a página do "voltar" neste tempo, a transição termina sem esperar. */
const MAX_WAIT_MS = 1500;
/** Posição de scroll de cada página visitada (para o "voltar"). */
const scrollPositions = new Map<string, number>();
/** Eventos `popstate` que nós próprios reenviámos. */
const replayed = new WeakSet<Event>();

const pageKey = () => window.location.pathname + window.location.search;

/**
 * Botão "voltar"/"avançar" do browser (e o "‹" do header na ficha).
 *
 * No "voltar" o router do Next repõe a página de forma síncrona, fora do
 * mecanismo de View Transitions do React — sem nada, a página trocava de
 * golpe. Por isso intercetamos o `popstate` e fazemos nós a transição:
 * fotografamos a página atual, reenviamos o evento ao router do Next dentro
 * de `document.startViewTransition` e terminamos quando a rota nova chega ao
 * DOM (`nav.onCommit`). O CSS (`data-manual-vt`) desliza a página inteira, e
 * a foto da ficha volta ao cartão do stock (`data-vt-gallery` →
 * `data-vt-card`). O scroll é guardado e reposto por nós
 * (`scrollRestoration = "manual"`): voltas ao ponto onde estavas.
 *
 * Registado ao carregar o módulo, de propósito: os listeners de `window`
 * correm pela ordem de registo, e o nosso tem de correr antes do do Next
 * (que o regista num efeito do router, depois da hidratação).
 */
function onPopState(e: PopStateEvent) {
  if (replayed.has(e) || !nav.key) return;
  // Só muda o #fragmento: não é uma troca de página.
  if (pageKey() === nav.key) return;

  scrollPositions.set(nav.key, window.scrollY);
  nav.restoreTo = scrollPositions.get(pageKey()) ?? 0;
  document.documentElement.dataset.navDir = navDirection(
    nav.pathname,
    window.location.pathname,
  );

  if (!canAnimate()) return; // o Next trata do evento como sempre

  e.stopImmediatePropagation();
  const replay = new PopStateEvent("popstate", { state: e.state });
  replayed.add(replay);

  const root = document.documentElement;
  const gallery = document.querySelector<HTMLElement>("[data-vt-gallery]");
  const slug = gallery?.dataset.vtGallery;
  const named: HTMLElement[] = [];
  const share = (el: HTMLElement) => {
    el.style.setProperty("view-transition-name", "vehicle-back");
    el.style.setProperty("view-transition-class", "vehicle-morph");
    named.push(el);
  };
  if (gallery) share(gallery);
  root.dataset.manualVt = "";

  const transition = document.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        const timer = window.setTimeout(finish, MAX_WAIT_MS);
        function finish() {
          window.clearTimeout(timer);
          nav.onCommit = null;
          resolve();
        }
        nav.onCommit = () => {
          const card = slug
            ? document.querySelector<HTMLElement>(
                `[data-vt-card="${CSS.escape(slug)}"]`,
              )
            : null;
          if (card) share(card);
          finish();
        };
        window.dispatchEvent(replay);
      }),
  );
  transition.finished.finally(() => {
    delete root.dataset.manualVt;
    named.forEach((el) => {
      el.style.removeProperty("view-transition-name");
      el.style.removeProperty("view-transition-class");
    });
  });
}
if (typeof window !== "undefined") {
  window.addEventListener("popstate", onPopState);
}

/**
 * Resposta imediata a cada navegação, antes de o servidor responder:
 *
 *  - dispara `NAV_START_EVENT` (barra de progresso, sublinhado do menu);
 *  - marca o link clicado com `data-nav-pending` (o cartão encolhe, ver CSS);
 *  - marca o `<html>` com `data-navigating` (cursor de progresso);
 *  - define `data-nav-dir` no `<html>` (forward/back): o CSS das View
 *    Transitions escolhe por aí o lado para onde a página desliza.
 *
 * Fase de captura: corre antes dos handlers do React (o `<Link>` do Next
 * cancela o clique para navegar pelo router, e um listener normal já não o
 * via). Não cancela nada — só observa.
 */
export function NavigationEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const safety = useRef<number>(undefined);

  useEffect(() => {
    const root = document.documentElement;
    // Via ScrollTrigger: ele guarda e repõe `history.scrollRestoration` a cada
    // refresh, e desfazia um "manual" posto diretamente.
    ScrollTrigger.clearScrollMemory("manual");

    function onClick(e: MouseEvent) {
      const url = internalNavigationTarget(e);
      if (!url) return;
      scrollPositions.set(pageKey(), window.scrollY);
      root.dataset.navDir = navDirection(nav.pathname, url.pathname);
      root.dataset.navigating = "";
      (e.target as Element).closest("a")?.setAttribute("data-nav-pending", "");
      window.clearTimeout(safety.current);
      safety.current = window.setTimeout(clearPending, SAFETY_MS);
      window.dispatchEvent(
        new CustomEvent<NavStartDetail>(NAV_START_EVENT, {
          detail: { pathname: url.pathname },
        }),
      );
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.clearTimeout(safety.current);
    };
  }, []);

  // Rota nova aplicada ao DOM. `useLayoutEffect`: o scroll do "voltar" é
  // reposto antes de o browser fotografar a página nova para a transição.
  useLayoutEffect(() => {
    nav.pathname = pathname;
    // Do estado do router, não de `location`: neste momento o Next ainda não
    // atualizou o endereço na barra.
    const query = searchParams.toString();
    nav.key = pathname + (query ? `?${query}` : "");
    if (nav.restoreTo !== null) {
      window.scrollTo(0, nav.restoreTo);
      nav.restoreTo = null;
    }
    nav.onCommit?.();
    window.clearTimeout(safety.current);
    clearPending();
  }, [pathname, searchParams]);

  return null;
}

function canAnimate() {
  return (
    typeof document.startViewTransition === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function clearPending() {
  delete document.documentElement.dataset.navigating;
  document
    .querySelectorAll("[data-nav-pending]")
    .forEach((el) => el.removeAttribute("data-nav-pending"));
}
