import { z } from "zod";
import { worklogHours } from "@/lib/operations";
import { isPlausiblePlate, plateKey } from "@/lib/plate";

/**
 * As três acções que podem ser propostas, e a sua validação.
 *
 * O modelo PROPÕE; isto valida. Uma proposta que não passe daqui nunca chega a
 * ser mostrada à pessoa nem guardada, por isso o que fica pendente é sempre
 * executável — e o que é executado é sempre o que foi mostrado.
 *
 * `veiculo` é o rótulo legível que vai na frase; `carId` é o identificador real,
 * resolvido pelo servidor. O modelo nunca vê nem escreve nenhum dos dois.
 */

export const COST_CATEGORIES = [
  "transport",
  "parts",
  "labour",
  "preparation",
  "other",
] as const;
export type CostCategory = (typeof COST_CATEGORIES)[number];

/** Categorias que bastam ter a Oficina — material, não dinheiro de gestão. */
const WORKSHOP_CATEGORIES: readonly CostCategory[] = ["parts", "other"];

export type PendingAction =
  | { kind: "register_vehicle"; nome: string; matricula: string; tipo: "car" | "motorcycle" }
  | {
      kind: "add_cost";
      carId: string;
      veiculo: string;
      categoria: CostCategory;
      descricao: string;
      valor: number;
      data: string;
    }
  | {
      kind: "log_hours";
      carId: string;
      veiculo: string;
      data: string;
      inicio: string;
      fim: string;
      horas: number;
      descricao: string;
    };

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const DIA = /^\d{4}-\d{2}-\d{2}$/;

/** O que o modelo pode pedir para cada proposta. */
export const RegisterInput = z.object({
  nome: z.string().trim().min(2).max(120),
  matricula: z.string().trim().min(2).max(20),
  tipo: z.enum(["car", "motorcycle"]).default("car"),
});

export const CostInput = z.object({
  viatura: z.string().trim().min(1).max(10),
  categoria: z.enum(COST_CATEGORIES),
  valor: z.number().positive().max(9_999_999),
  descricao: z.string().trim().min(1).max(500),
  data: z.string().regex(DIA).optional(),
});

export const HoursInput = z.object({
  viatura: z.string().trim().min(1).max(10),
  data: z.string().regex(DIA),
  inicio: z.string().regex(HHMM),
  fim: z.string().regex(HHMM),
  noite: z.boolean().default(false),
  descricao: z.string().trim().max(2000).optional(),
});

export type BuildResult =
  | { ok: true; action: PendingAction }
  | { ok: false; error: string };

/** A pessoa pode lançar um custo desta categoria? */
export function canUseCategory(
  categoria: CostCategory,
  sections: readonly string[],
): boolean {
  if (sections.includes("financeiro")) return true;
  return WORKSHOP_CATEGORIES.includes(categoria) && sections.includes("oficina");
}

export function buildRegister(
  input: z.infer<typeof RegisterInput>,
  sections: readonly string[],
): BuildResult {
  if (!sections.includes("oficina"))
    return { ok: false, error: "Não tem acesso à Oficina. Fale com o responsável." };
  if (!isPlausiblePlate(input.matricula))
    return {
      ok: false,
      error: "Essa matrícula não parece válida. Indique-a com 6 caracteres, ex.: 00-TE-00.",
    };
  return {
    ok: true,
    action: {
      kind: "register_vehicle",
      nome: input.nome,
      matricula: plateKey(input.matricula),
      tipo: input.tipo,
    },
  };
}

export function buildCost(
  input: z.infer<typeof CostInput>,
  vehicle: { carId: string; veiculo: string },
  sections: readonly string[],
  today: string,
): BuildResult {
  if (!canUseCategory(input.categoria, sections)) {
    // Mensagem útil em vez de "sem permissão": o mecânico quase sempre queria
    // lançar material e escolheu a categoria errada.
    return sections.includes("oficina")
      ? {
          ok: false,
          error: "Mão de obra sai das horas, não de uma despesa. Se for material, digo peças.",
        }
      : { ok: false, error: "Não tem acesso a Custos e margens. Fale com o responsável." };
  }
  const data = input.data ?? today;
  if (data > today) return { ok: false, error: "Essa data é no futuro." };
  return {
    ok: true,
    action: {
      kind: "add_cost",
      carId: vehicle.carId,
      veiculo: vehicle.veiculo,
      categoria: input.categoria,
      descricao: input.descricao,
      valor: Math.round(input.valor * 100) / 100,
      data,
    },
  };
}

export function buildHours(
  input: z.infer<typeof HoursInput>,
  vehicle: { carId: string; veiculo: string },
  sections: readonly string[],
  today: string,
): BuildResult {
  if (!sections.includes("oficina"))
    return { ok: false, error: "Não tem acesso à Oficina. Fale com o responsável." };
  if (input.data > today) return { ok: false, error: "Essa data é no futuro." };
  // A mesma regra do backoffice, na mesma função: duração zero recusada e
  // intervalo invertido só como trabalho nocturno declarado.
  const duracao = worklogHours(input.inicio, input.fim, input.noite);
  if ("error" in duracao) return { ok: false, error: duracao.error };
  return {
    ok: true,
    action: {
      kind: "log_hours",
      carId: vehicle.carId,
      veiculo: vehicle.veiculo,
      data: input.data,
      inicio: input.inicio,
      fim: input.fim,
      horas: duracao.hours,
      descricao: input.descricao?.trim() ?? "",
    },
  };
}
