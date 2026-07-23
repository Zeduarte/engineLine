import { useEffect, useLayoutEffect } from "react";

/**
 * `useLayoutEffect` avisa no servidor porque não corre lá. O GSAP recomenda
 * esta variante isomórfica para setup de animações sem flash de layout.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
