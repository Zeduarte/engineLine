import { sameBrand } from "@/lib/brand-name";
import { plateKey } from "@/lib/plate";
import { normalize } from "@/lib/whatsapp/confirm";

/**
 * Encontrar a viatura a partir de texto solto ("bmw 320 preto", "33-AD-22").
 *
 * Função pura, e de propósito: é aqui que se decide se uma despesa de 450 € vai
 * para a viatura certa, por isso tem de ser testável sem base de dados nem
 * modelo.
 *
 * A regra que governa tudo: com mais de uma candidata plausível, NÃO se escolhe.
 * Pergunta-se. Um custo na viatura errada é pior do que uma mensagem a mais.
 */

export interface Candidate {
  id: string;
  make: string;
  model: string;
  variant?: string | null;
  color?: string | null;
  license_plate?: string | null;
  status?: string | null;
}

export interface VehicleQuery {
  matricula?: string;
  marca?: string;
  modelo?: string;
  cor?: string;
  texto?: string;
}

export interface Ranked extends Candidate {
  score: number;
}

/** Abaixo disto não é candidata: evita devolver o stock todo por uma cor. */
const FLOOR = 25;
/** Uma matrícula exacta decide. Nada empata com isto. */
const PLATE = 1000;

function words(text: string): string[] {
  return normalize(text).split(" ").filter(Boolean);
}

function scoreOne(q: VehicleQuery, c: Candidate): number {
  const plate = q.matricula ? plateKey(q.matricula) : "";
  if (plate && c.license_plate && plateKey(c.license_plate) === plate) return PLATE;

  // O texto livre alimenta os campos que não foram indicados explicitamente.
  const livres = q.texto ? words(q.texto) : [];
  const marca = q.marca ?? livres.find((w) => sameBrand(w, c.make)) ?? "";
  const modelo = normalize(q.modelo ?? "");
  const cor = normalize(q.cor ?? "");

  let score = 0;
  if (marca && sameBrand(marca, c.make)) score += 40;
  const modeloC = normalize(c.model);
  if (modelo && modeloC && (modeloC.includes(modelo) || modelo.includes(modeloC)))
    score += 30;
  else if (livres.some((w) => w.length > 1 && modeloC.includes(w))) score += 25;

  const corC = normalize(c.color ?? "");
  if (cor && corC && corC === cor) score += 15;
  else if (corC && livres.includes(corC)) score += 15;

  const variante = normalize(c.variant ?? "");
  if (variante && livres.some((w) => w.length > 2 && variante.includes(w))) score += 10;

  // Uma viatura vendida é quase sempre a errada, mas não se exclui: pode haver
  // uma despesa a lançar depois da venda.
  if (score > 0 && c.status !== "sold") score += 5;
  return score;
}

/**
 * Ordena as candidatas. A lista que entra já vem filtrada pelas permissões do
 * colaborador (`wa_vehicles_for_actor`), por isso o que não pode ver nunca
 * chega aqui — não é preciso filtrar outra vez, e é importante que não apareça
 * sequer como "existe mas não podes".
 */
export function rankVehicles(q: VehicleQuery, cars: Candidate[]): Ranked[] {
  const scored = cars
    .map((c) => ({ ...c, score: scoreOne(q, c) }))
    .filter((c) => c.score >= FLOOR)
    .sort((a, b) => b.score - a.score);

  // Matrícula exacta: é aquela e mais nenhuma.
  if (scored[0]?.score === PLATE) return [scored[0]];

  // Um vencedor destacado não é ambiguidade. Sem esta regra, "bmw 320 preto"
  // ficava empatado com um "bmw 320" cinzento e obrigava a perguntar sempre.
  if (scored.length > 1 && scored[0]!.score - scored[1]!.score >= 15)
    return [scored[0]!];

  return scored;
}
