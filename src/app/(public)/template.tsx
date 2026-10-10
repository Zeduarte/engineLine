"use client";

import { ViewTransition } from "@/components/ui/ViewTransition";

/**
 * `template.tsx` (ao contrário de `layout.tsx`) re-monta a cada navegação: a
 * página antiga sai e a nova entra. O `<ViewTransition>` do React anima essa
 * troca com a View Transitions API do browser — a página desliza para o lado
 * (classes `page-in`/`page-out`, direção em `data-nav-dir`; CSS em
 * globals.css). Fotos com o mesmo `name` (cartão → galeria) voam entre as
 * duas páginas por cima do deslize.
 *
 * O React só arranca a transição quando a página nova está pronta, por isso a
 * antiga continua viva durante o pedido ao servidor. `default="none"`:
 * mudanças dentro da mesma página (filtros, ordenação) não deslizam.
 * Com "reduzir movimento", o CSS desliga as animações.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter="page-in" exit="page-out" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
