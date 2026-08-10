/**
 * Camada de grão/textura sobre toda a página. Um `feTurbulence` SVG em data-URI
 * (sem pedidos de rede) dá uma textura fílmica subtil que "quebra" as
 * superfícies planas do dark mode e reforça o toque premium. Puramente
 * decorativo e `pointer-events-none`.
 */
export function GrainOverlay() {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>`;
  const uri = `url("data:image/svg+xml;utf8,${svg}")`;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[70] opacity-[0.035] mix-blend-overlay"
      style={{ backgroundImage: uri, backgroundSize: "140px 140px" }}
    />
  );
}
