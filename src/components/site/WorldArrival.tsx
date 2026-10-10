import type { VehicleType } from "@/lib/vehicle-categories";
import { ARRIVAL_KEY, ARRIVAL_TTL_MS } from "@/lib/world-arrival";
import { WorldCoverArt, worldCoverStyles as styles } from "./WorldCover";
import { WorldArrivalExit } from "./WorldArrivalExit";

/**
 * Segunda metade da troca de mundo: a página nova abre tapada pela imagem do
 * mundo escolhido, que depois sai para o lado.
 *
 * Tem de tapar ANTES do primeiro desenho, senão a página nova piscava antes da
 * animação. Por isso a capa vem no HTML (escondida) e um script, logo a seguir,
 * mostra-a se a página anterior marcou a chegada. O React só trata da saída.
 */
export function WorldArrival({ type }: { type: VehicleType }) {
  const reveal = `(function(){try{var e=document.getElementById("world-arrival");var a=JSON.parse(sessionStorage.getItem(${JSON.stringify(ARRIVAL_KEY)})||"null");if(e&&a&&a.type===e.getAttribute("data-world")&&Date.now()-a.t<${ARRIVAL_TTL_MS}&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){e.setAttribute("data-show","");var i=e.querySelector("img");if(i)i.loading="eager"}}catch(_){}})();`;
  return (
    <>
      <div
        id="world-arrival"
        data-world={type}
        className={`${styles.overlay} ${styles.arrival}`}
        aria-hidden
        suppressHydrationWarning
      >
        <WorldCoverArt type={type} lazy />
      </div>
      <script dangerouslySetInnerHTML={{ __html: reveal }} />
      <WorldArrivalExit />
    </>
  );
}
