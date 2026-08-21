import { LEGAL_UPDATED } from "@/lib/legal";

/**
 * Layout comum às páginas legais (privacidade, cookies, termos). Tipografia
 * legível em coluna estreita; estilos aplicados por selector aos elementos
 * filhos para o conteúdo de cada página ficar simples de escrever.
 */
export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container-px pb-24 pt-32 md:pt-40">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow mb-4">Informação legal</p>
        <h1 className="text-headline font-semibold text-paper">{title}</h1>
        <p className="mt-3 text-sm text-paper/40">
          Última atualização: {LEGAL_UPDATED}
        </p>

        <div className="mt-10 space-y-4 leading-relaxed text-paper/70 [&_a]:text-accent [&_a]:underline [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-paper [&_li]:mt-2 [&_strong]:text-paper [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>
      </div>
    </div>
  );
}
