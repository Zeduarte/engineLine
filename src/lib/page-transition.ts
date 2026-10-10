/**
 * Estado partilhado das transições de página.
 *
 * O `PageTransitions` arranca uma View Transition no clique; o `template.tsx`
 * lê `active` ao montar a página nova para não animar por cima dela (a
 * transição do browser já a está a animar).
 */
export const pageTransition = { active: false };

/** Disparado no clique em qualquer link interno (a barra de progresso ouve). */
export const NAV_START_EVENT = "site:navigation-start";
