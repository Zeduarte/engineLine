/**
 * Ponto único de configuração do GSAP.
 *
 * O ScrollTrigger acede ao `window`, por isso o registo tem de acontecer só no
 * cliente. Importar deste módulo (em vez de "gsap" diretamente) garante que o
 * plugin está registado uma só vez e evita duplicação em Fast Refresh.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// `registerPlugin` é idempotente, mas guardamos com uma flag de módulo para
// evitar trabalho repetido em Fast Refresh.
let registered = false;
if (typeof window !== "undefined" && !registered) {
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

export { gsap, ScrollTrigger };
