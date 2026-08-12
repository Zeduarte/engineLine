"use client";

/** Botão que aciona a impressão / "Guardar como PDF" do browser. */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print rounded-full bg-accent px-6 py-3 text-sm font-semibold text-ink transition-transform hover:scale-[1.02]"
    >
      Imprimir / Guardar PDF
    </button>
  );
}
