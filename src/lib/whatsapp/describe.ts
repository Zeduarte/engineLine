import { COST_LABELS } from "@/lib/operations";
import { formatPlate } from "@/lib/plate";
import type { PendingAction } from "@/lib/whatsapp/actions";

/**
 * As frases que o colaborador lê.
 *
 * UMA função para a pergunta e para o recibo, com o tempo verbal como
 * parâmetro: assim a confirmação e o recibo não podem discordar entre si. Se
 * fossem duas funções, um dia uma mudava e a outra não, e a pessoa confirmava
 * uma coisa e recebia a confirmação de outra.
 *
 * Nada disto é escrito pelo modelo. O texto é gerado a partir dos valores já
 * validados, por isso o valor que a pessoa lê é forçosamente o valor que fica
 * gravado.
 */

/**
 * Euros com cêntimos quando existem.
 *
 * Não se usa o `formatPrice` de `src/lib/format.ts` porque esse arredonda
 * (`maximumFractionDigits: 0`) — bom para o preço de um anúncio, mas num recibo
 * de despesa 450,50 € não pode aparecer como "451 €".
 */
export function formatMoney(value: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** "2026-09-24" → "24/09/2026". */
export function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Como referir uma viatura numa frase: sempre com a matrícula, quando existe. */
export function vehicleLabel(v: {
  make: string;
  model: string;
  license_plate?: string | null;
}): string {
  const nome = `${v.make} ${v.model}`.trim();
  return v.license_plate
    ? `${nome}, matrícula ${formatPlate(v.license_plate)}`
    : nome;
}

export type Tense = "futuro" | "passado";

/** A frase da acção, no tempo pedido. */
export function describeAction(action: PendingAction, tense: Tense): string {
  const futuro = tense === "futuro";
  switch (action.kind) {
    case "register_vehicle":
      return futuro
        ? `Vai ser registada na oficina a viatura ${action.nome}, matrícula ${formatPlate(action.matricula)}.`
        : `Registada na oficina a viatura ${action.nome}, matrícula ${formatPlate(action.matricula)}.`;
    case "add_cost": {
      const cat = COST_LABELS[action.categoria] ?? action.categoria;
      const fim = `${action.veiculo}, no valor de ${formatMoney(action.valor)} — ${action.descricao} (${cat}, ${formatDay(action.data)}).`;
      return futuro
        ? `Vai ser adicionada uma despesa ao ${fim}`
        : `Foi adicionada uma despesa ao ${fim}`;
    }
    case "log_hours": {
      const nota = action.descricao ? ` — ${action.descricao}` : "";
      const fim = `${action.veiculo}: ${action.inicio} às ${action.fim}, ${action.horas.toLocaleString("pt-PT")} h, em ${formatDay(action.data)}${nota}.`;
      return futuro ? `Vão ser registadas horas no ${fim}` : `Registadas horas no ${fim}`;
    }
  }
}

/** A pergunta completa, com o pedido de confirmação. */
export function confirmationMessage(action: PendingAction): string {
  return `${describeAction(action, "futuro")}\n\nConfirma? Responda «sim».`;
}

/** O recibo. */
export function receiptMessage(action: PendingAction): string {
  return describeAction(action, "passado");
}
