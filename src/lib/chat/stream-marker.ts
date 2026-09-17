/**
 * O modelo termina algumas respostas com `[[ACOES: ...]]`. Em streaming, o
 * texto chega aos pedaços — este buffer evita que o marcador apareça no ecrã
 * do visitante antes de o servidor o retirar.
 *
 * Retém tudo a partir do momento em que o texto acumulado pode estar a começar
 * um marcador, e liberta o resto imediatamente.
 */

const MARKER_START = "[[ACOES:";
const LOWER = MARKER_START.toLowerCase();

/** Índice até onde é seguro emitir o texto acumulado. */
export function safeEmitLength(buffer: string): number {
  const lower = buffer.toLowerCase();

  // Marcador já começou algures — nada a partir daí sai.
  const full = lower.indexOf(LOWER);
  if (full !== -1) return trimEndIndex(buffer, full);

  // O fim do buffer pode ser o início de um marcador ("[", "[[", "[[AC"…).
  const from = Math.max(0, buffer.length - LOWER.length + 1);
  for (let i = from; i < buffer.length; i++) {
    if (LOWER.startsWith(lower.slice(i))) return trimEndIndex(buffer, i);
  }

  // Espaços no fim ficam retidos: podem ser a moldura de um marcador que ainda
  // não chegou. Saem no delta seguinte, junto com a palavra que os segue.
  return trimEndIndex(buffer, buffer.length);
}

function trimEndIndex(buffer: string, end: number): number {
  let i = end;
  while (i > 0 && /\s/.test(buffer[i - 1]!)) i--;
  return i;
}

/** Acumula deltas e devolve apenas a parte que já pode ser mostrada. */
export class MarkerBuffer {
  private buffer = "";
  private emitted = 0;

  /** Junta um delta e devolve o texto novo a mostrar (pode ser vazio). */
  push(delta: string): string {
    this.buffer += delta;
    const safe = safeEmitLength(this.buffer);
    if (safe <= this.emitted) return "";
    const chunk = this.buffer.slice(this.emitted, safe);
    this.emitted = safe;
    return chunk;
  }

  /** Texto completo recebido, marcador incluído. */
  get raw(): string {
    return this.buffer;
  }

  /** Quantos caracteres já foram entregues ao visitante. */
  get emittedLength(): number {
    return this.emitted;
  }
}
