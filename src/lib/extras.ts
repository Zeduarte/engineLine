/**
 * Agrupa os extras (lista simples de texto) em categorias, ao estilo dos
 * grandes portais (Áudio & Multimédia, Conforto, Segurança, Tecnologia).
 *
 * A categorização é heurística por palavras-chave — a ordem dos grupos importa
 * (o primeiro que casar ganha), por isso Segurança vem antes de Tecnologia
 * para "sensores"/"airbags" caírem no sítio certo. O que não casar vai para
 * "Outros equipamentos".
 */
export interface ExtrasGroup {
  title: string;
  items: string[];
}

const RULES: { title: string; keywords: string[] }[] = [
  {
    title: "Áudio e Multimédia",
    keywords: [
      "bluetooth", "rádio", "radio", "navega", "gps", "usb", "carplay",
      "android auto", "multimédia", "multimedia", "som", "colunas", "aux",
      "ecrã", "ecra", "écran", "touchscreen", "spotify",
    ],
  },
  {
    title: "Segurança",
    keywords: [
      "abs", "airbag", "esp", "isofix", "cadeira", "alarme", "imobiliza",
      "cinto", "travão", "travagem", "estabilidade", "assist", "colisão",
      "faixa", "ângulo morto", "angulo morto", "distância", "distancia",
    ],
  },
  {
    title: "Tecnologia e Eletrónica",
    keywords: [
      "câmara", "camara", "camera", "retrovisor", "keyless", "start/stop",
      "start-stop", "arranque", "head-up", "cockpit", "digital", "led",
      "xénon", "xenon", "matrix", "sensor de estacion", "sensores de estacion",
      "park", "cruise", "adaptativo",
    ],
  },
  {
    title: "Conforto",
    keywords: [
      "ac ", "ar condicionado", "climatiz", "banco", "estofo", "pele",
      "apoio de braço", "apoio de braco", "sensor de chuva", "teto", "tecto",
      "vidros", "volante", "aquec", "massagem", "memória", "memoria",
      "isolamento", "cortina", "solar", "elevador",
    ],
  },
];

/** Devolve os extras organizados por categoria (só grupos com itens). */
export function groupExtras(extras: string[] | undefined): ExtrasGroup[] {
  if (!extras || extras.length === 0) return [];

  const buckets = new Map<string, string[]>();
  const others: string[] = [];

  for (const raw of extras) {
    const extra = raw.trim();
    if (!extra) continue;
    const hay = ` ${extra.toLowerCase()} `;
    const rule = RULES.find((r) => r.keywords.some((k) => hay.includes(k)));
    if (rule) {
      const list = buckets.get(rule.title) ?? [];
      list.push(extra);
      buckets.set(rule.title, list);
    } else {
      others.push(extra);
    }
  }

  const groups: ExtrasGroup[] = [];
  for (const r of RULES) {
    const items = buckets.get(r.title);
    if (items && items.length) groups.push({ title: r.title, items });
  }
  if (others.length) groups.push({ title: "Outros equipamentos", items: others });
  return groups;
}
