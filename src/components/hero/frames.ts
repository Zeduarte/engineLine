/**
 * Configuração da sequência 360º do hero.
 *
 * ── Como ligar frames reais ──────────────────────────────────────────────
 * 1. Exportar ~90 frames de uma volta completa da viatura (idealmente .webp,
 *    fundo transparente ou preto #0A0A0A), nomeados sequencialmente:
 *        public/hero/frames/car_0001.webp … car_0090.webp
 * 2. Pôr `USE_PROCEDURAL_PLACEHOLDER = false`.
 * 3. Ajustar `FRAME_COUNT` e `framePath()` se a nomenclatura for outra.
 *
 * Enquanto não há frames reais, o canvas desenha um placeholder procedural
 * que roda — assim o efeito é visível e testável sem qualquer asset binário
 * no repositório.
 */

export const FRAME_COUNT = 90;

export const USE_PROCEDURAL_PLACEHOLDER = true;

/** Caminho do frame `index` (0-based). */
export function framePath(index: number): string {
  const n = String(index + 1).padStart(4, "0");
  return `/hero/frames/car_${n}.webp`;
}
