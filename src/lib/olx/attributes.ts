import { normalize } from "@/lib/whatsapp/confirm";

/**
 * Correspondência entre os campos da viatura e os atributos do OLX.
 *
 * Os códigos dos atributos variam por país e categoria e não vêm na
 * documentação, por isso não se escrevem aqui: vêm de
 * `/categories/{id}/attributes`, guardados em `olx_category_cache`. O que se
 * escreve aqui é como reconhecer cada atributo — pelo código ou pela etiqueta
 * — e como escolher o valor certo da lista que o OLX aceita.
 *
 * Um atributo obrigatório sem correspondência não é inventado: o anúncio não é
 * publicado e o erro diz qual é. Publicar um carro a gasóleo como "gasolina"
 * por ter escolhido o primeiro valor da lista seria pior do que não publicar.
 */

export interface OlxAttributeDef {
  code: string;
  label: string;
  unit?: string | null;
  validation?: {
    type?: string;
    required?: boolean;
    numeric?: boolean;
    allow_multiple_values?: boolean;
  };
  values?: { code: string; label: string }[];
}

export interface OlxAttribute {
  code: string;
  value?: string;
  values?: string[];
}

/** O que a viatura sabe sobre si. Valores vazios contam como "não indicado". */
export interface CarFacts {
  make: string;
  model: string;
  year: number;
  mileage: number;
  fuel: string;
  transmission: string;
  body: string;
  power: number;
  displacement: number;
  color: string | null;
  doors: number;
  seats: number;
  registrationMonth: number | null;
}

type Field = keyof CarFacts | "condition";

/**
 * Palavras que identificam cada campo no código ou na etiqueta do atributo.
 * Ordem importa: "model" tem de ser testado antes de "make" para "modelo"
 * não cair em "marca" por engano (não cai — mas a ordem deixa-o explícito).
 */
const FIELD_HINTS: [Field, string[]][] = [
  ["model", ["model", "modelo"]],
  ["make", ["make", "brand", "marca"]],
  ["year", ["year", "ano"]],
  ["registrationMonth", ["mes", "month"]],
  ["mileage", ["mileage", "quilometr", "km"]],
  ["fuel", ["fuel", "combustivel"]],
  ["transmission", ["transmission", "gearbox", "caixa", "transmissao"]],
  ["body", ["body", "segmento", "carrocaria", "tipo de veiculo", "car_body"]],
  ["power", ["power", "potencia", "cv"]],
  ["displacement", ["engine_capacity", "cilindrada", "displacement", "cm3"]],
  ["color", ["color", "colour", "cor"]],
  ["doors", ["door", "porta"]],
  ["seats", ["seat", "lugar"]],
  ["condition", ["condition", "estado", "state"]],
];

/** Sinónimos de valores que o OLX e o site escrevem de forma diferente. */
const VALUE_SYNONYMS: Record<string, string[]> = {
  gasolina: ["gasolina", "petrol"],
  diesel: ["diesel", "gasoleo"],
  hibrido: ["hibrido", "hybrid"],
  "hibrido plug-in": ["plug-in", "hibrido plug-in", "phev"],
  eletrico: ["eletrico", "electrico", "electric"],
  gpl: ["gpl", "lpg"],
  manual: ["manual"],
  automatica: ["automatica", "automatico", "automatic"],
  berlina: ["berlina", "sedan"],
  suv: ["suv", "todo o terreno", "tt"],
  carrinha: ["carrinha", "station wagon", "break"],
  citadino: ["citadino", "utilitario", "pequeno citadino"],
  coupe: ["coupe"],
  descapotavel: ["descapotavel", "cabrio", "convertible"],
  monovolume: ["monovolume", "mpv"],
  usado: ["usado", "used"],
};

/** Qual campo da viatura corresponde a este atributo, se algum. */
export function fieldFor(def: OlxAttributeDef): Field | null {
  const hay = ` ${normalize(def.code.replace(/_/g, " "))} ${normalize(def.label)} `;
  for (const [field, hints] of FIELD_HINTS) {
    if (hints.some((h) => hay.includes(` ${h}`) || hay.includes(`${h} `))) return field;
  }
  return null;
}

function rawValue(field: Field, car: CarFacts): string | number | null {
  if (field === "condition") return "usado";
  const v = car[field];
  if (v === null || v === undefined || v === "" || v === 0) return null;
  return v;
}

/** Escolhe da lista do OLX o valor que corresponde ao da viatura. */
export function pickValue(
  wanted: string,
  options: { code: string; label: string }[],
): string | null {
  const w = normalize(wanted);
  const candidates = VALUE_SYNONYMS[w] ?? [w];
  const norm = options.map((o) => ({ ...o, n: normalize(o.label), c: normalize(o.code) }));
  // 1) igualdade exacta com a etiqueta ou o código; 2) a etiqueta contém.
  for (const cand of candidates) {
    const exact = norm.find((o) => o.n === cand || o.c === cand);
    if (exact) return exact.code;
  }
  for (const cand of candidates) {
    const partial = norm.filter((o) => o.n.includes(cand) || cand.includes(o.n));
    // Só se não houver dúvida: duas correspondências parciais = não escolhe.
    if (partial.length === 1) return partial[0]!.code;
  }
  return null;
}

export interface AttributeResult {
  attributes: OlxAttribute[];
  /** Obrigatórios que ficaram por preencher, com a razão. */
  missing: string[];
}

export function mapAttributes(defs: OlxAttributeDef[], car: CarFacts): AttributeResult {
  const attributes: OlxAttribute[] = [];
  const missing: string[] = [];

  for (const def of defs) {
    const kind = def.validation?.type;
    // O preço e o salário têm campos próprios no anúncio, não são atributos.
    if (kind === "price" || kind === "salary") continue;
    const required = !!def.validation?.required;
    const field = fieldFor(def);
    const raw = field ? rawValue(field, car) : null;

    if (raw === null) {
      if (required)
        missing.push(
          field
            ? `«${def.label}» é obrigatório no OLX e a viatura não o tem preenchido`
            : `«${def.label}» é obrigatório no OLX e o site não tem esse campo`,
        );
      continue;
    }

    if (def.values && def.values.length) {
      const code = pickValue(String(raw), def.values);
      if (code) attributes.push({ code: def.code, value: code });
      else if (required)
        missing.push(`«${def.label}»: o OLX não aceita o valor «${raw}»`);
      continue;
    }

    attributes.push({
      code: def.code,
      value: def.validation?.numeric
        ? String(Math.round(Number(raw)))
        : String(raw),
    });
  }

  return { attributes, missing };
}
