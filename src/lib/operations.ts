/** Pure domain helpers, shared by UI and regression tests. */
export const COST_LABELS: Record<string, string> = { transport: "Transporte", parts: "Peças", labour: "Mão de obra", preparation: "Preparação", other: "Outros" };
export const TASK_LABELS: Record<string, string> = { pending: "Pendente", in_progress: "Em execução", waiting_parts: "A aguardar peças", done: "Concluído" };
export function margin(purchase: number | null, costs: number, sale: number | null): number | null {
  return purchase === null || sale === null ? null : Math.round((sale - purchase - costs) * 100) / 100;
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
