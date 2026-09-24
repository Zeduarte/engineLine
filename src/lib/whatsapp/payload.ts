/**
 * Leitura do que a Meta entrega.
 *
 * O webhook recebe muito mais recibos de entrega (`statuses`) do que mensagens,
 * e as listas podem trazer mais de um elemento. Por isso isto é tolerante por
 * desenho: o que não se reconhece é ignorado em vez de estourar — um erro aqui
 * faria a rota devolver 500 e a Meta reentregar em ciclo.
 */

export interface InboundMessage {
  wamId: string;
  from: string;
  /** "text" ou o tipo que a Meta indicou (image, audio, button, …). */
  type: string;
  /** Só preenchido quando `type === "text"`. */
  text: string;
  phoneNumberId: string;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

/** Extrai as mensagens de um corpo da Meta. Nunca lança. */
export function extractMessages(payload: unknown): InboundMessage[] {
  const out: InboundMessage[] = [];
  for (const entry of asArray(asRecord(payload).entry)) {
    for (const change of asArray(asRecord(entry).changes)) {
      const value = asRecord(asRecord(change).value);
      const phoneNumberId = String(asRecord(value.metadata).phone_number_id ?? "");
      for (const raw of asArray(value.messages)) {
        const m = asRecord(raw);
        const wamId = typeof m.id === "string" ? m.id : "";
        const from = typeof m.from === "string" ? m.from : "";
        if (!wamId || !from) continue;
        const type = typeof m.type === "string" ? m.type : "unknown";
        const body = asRecord(m.text).body;
        out.push({
          wamId,
          from,
          type,
          text: type === "text" && typeof body === "string" ? body : "",
          phoneNumberId,
        });
      }
    }
  }
  return out;
}
