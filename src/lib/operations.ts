/** Pure domain helpers, shared by UI and regression tests. */
export const COST_LABELS: Record<string, string> = { transport: "Transporte", parts: "Peças", labour: "Mão de obra", preparation: "Preparação", other: "Outros" };
export const TASK_LABELS: Record<string, string> = { pending: "Pendente", in_progress: "Em execução", waiting_parts: "A aguardar peças", done: "Concluído" };
export function margin(purchase: number | null, costs: number, sale: number | null): number | null {
  return purchase === null || sale === null ? null : Math.round((sale - purchase - costs) * 100) / 100;
}
/**
 * Porque é que a margem não dá para calcular.
 *
 * Dizer sempre "Aquisição por preencher" era enganador: com a aquisição
 * gravada e o preço anunciado sob consulta, o que falta é o preço, e o
 * utilizador ficava a olhar para um campo que já tinha preenchido.
 */
export function marginHint(purchase: number | null, sale: number | null): string {
  if (purchase === null && sale === null) return "Aquisição e preço por preencher";
  if (purchase === null) return "Aquisição por preencher";
  return "Preço por preencher";
}
/** Minutos desde 00:00 de uma hora "HH:MM". */
function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * Horas de um lançamento da oficina.
 *
 * Sem fim, o turno está em aberto (0 h). Fim igual ao início é recusado: um
 * registo de 0 h não diz nada e era aceite em silêncio. Fim antes do início só
 * conta como trabalho nocturno se quem lança o disser — antes somavam-se 24 h
 * sem perguntar, e 11:00–10:00 saía como 23 h de trabalho.
 */
export function worklogHours(
  start: string,
  end: string,
  overnight: boolean,
): { hours: number } | { error: string } {
  if (!end) return { hours: 0 };
  let diff = toMinutes(end) - toMinutes(start);
  if (diff === 0)
    return {
      error:
        "O fim é igual ao início. Corrija as horas ou deixe o fim em branco para um turno em aberto.",
    };
  if (diff < 0) {
    if (!overnight)
      return {
        error:
          "O fim é antes do início. Marque «Terminou no dia seguinte» se o trabalho passou da meia-noite.",
      };
    diff += 24 * 60;
  }
  return { hours: Math.round((diff / 60) * 100) / 100 };
}
export function daysInStock(acquired: string | null, sold: string | null, today = new Date().toISOString().slice(0, 10)): number | null {
  return acquired ? Math.max(0, Math.floor((Date.parse(sold ?? today) - Date.parse(acquired)) / 86400000)) : null;
}
export function preparationLabel(tasks: {stage: string; status: string}[]): string {
  if (!tasks.length) return "Preparação por definir";
  if (tasks.some(t => t.status === "waiting_parts")) return "A aguardar peças";
  if (tasks.some(t => t.stage === "preparation" && t.status !== "done")) return "Em preparação";
  if (!tasks.some(t => t.stage === "preparation")) return "Preparação por definir";
  if (tasks.some(t => t.stage === "delivery") && tasks.every(t => t.status === "done")) return "Pronta para entrega";
  return "Pronta para anunciar";
}
export function csvCell(value: unknown): string {
  let text = String(value ?? "");
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
