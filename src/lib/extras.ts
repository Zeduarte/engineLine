/**
 * Extras/equipamento organizados por categoria (Áudio & Multimédia, Conforto,
 * Segurança, Tecnologia). Esta é a fonte única:
 *  - o backoffice usa `EXTRAS_CATALOG` para o admin escolher por checkbox;
 *  - a ficha pública usa `groupExtras` para mostrar por categoria.
 *
 * Como o catálogo é partilhado, o que o admin marca numa categoria aparece
 * exatamente na mesma categoria no site. Extras escritos à mão (texto livre)
 * são encaixados por palavras-chave e, se nada casar, vão para "Outros".
 */
export interface ExtrasGroup {
  title: string;
  items: string[];
}

/** Catálogo de referência, agrupado por categoria (usado no backoffice). */
export const EXTRAS_CATALOG: ExtrasGroup[] = [
  {
    title: "Áudio e Multimédia",
    items: [
      "Bluetooth",
      "Rádio",
      "Sistema de navegação",
      "Apple CarPlay",
      "Android Auto",
      "Ecrã tátil",
      "Sistema de som premium",
      "USB",
    ],
  },
  {
    title: "Conforto",
    items: [
      "AC automático",
      "Climatização bi-zona",
      "Apoio de braço dianteiro",
      "Sensor de chuva",
      "Tecto de abrir/correr elétrico",
      "Vidros elétricos dianteiros",
      "Vidros elétricos traseiros",
      "Vidros traseiros fumados",
      "Bancos em pele",
      "Bancos aquecidos",
      "Bancos elétricos",
      "Volante em pele",
      "Volante multifunções",
      "Volante desportivo",
      "Porta-bagagens elétrico",
    ],
  },
  {
    title: "Segurança",
    items: [
      "ABS",
      "Airbag do condutor",
      "Airbag do passageiro",
      "Airbags laterais",
      "ESP Controle Eletrónico de Estabilidade",
      "Fixação para cadeira de criança (Isofix)",
      "Assistente de faixa de rodagem",
      "Alerta de ângulo morto",
      "Travagem automática de emergência",
      "Cruise control",
      "Cruise control adaptativo",
    ],
  },
  {
    title: "Tecnologia e Eletrónica",
    items: [
      "Câmara de marcha atrás",
      "Câmara 360º",
      "Sensores de estacionamento traseiros",
      "Sensores de estacionamento dianteiros",
      "Retrovisores com regulação elétrica",
      "Faróis LED",
      "Faróis Xénon",
      "Faróis Matrix",
      "Start/Stop",
      "Head-up display",
      "Chave inteligente / Keyless",
      "Jantes de liga leve",
    ],
  },
];

/**
 * Catálogo de equipamento de MOTA. Uma mota não tem vidros elétricos, volante
 * nem climatização bi-zona; oferecer essas opções no formulário só convidava a
 * publicar equipamento que a mota não tem.
 */
export const MOTORCYCLE_EXTRAS_CATALOG: ExtrasGroup[] = [
  {
    title: "Travagem e controlo",
    items: [
      "ABS",
      "ABS em curva",
      "Controlo de tração",
      "Controlo de wheelie",
      "Modos de condução",
      "Travão de motor regulável",
      "Embraiagem anti-dribbling",
    ],
  },
  {
    title: "Motor e ciclística",
    items: [
      "Quickshifter",
      "Suspensão regulável",
      "Suspensão eletrónica",
      "Escape desportivo",
      "Jantes de liga leve",
      "Jantes de raios",
      "Pneus novos",
    ],
  },
  {
    title: "Conforto e touring",
    items: [
      "Punhos aquecidos",
      "Assento aquecido",
      "Para-brisas regulável",
      "Cruise control",
      "Cavalete central",
      "Malas laterais",
      "Top case",
      "Protetores de motor",
      "Tomada USB",
      "Tomada 12V",
    ],
  },
  {
    title: "Eletrónica e iluminação",
    items: [
      "Ecrã TFT",
      "Faróis LED",
      "Luz diurna (DRL)",
      "Piscas sequenciais",
      "Navegação",
      "Bluetooth",
      "Alarme",
      "Keyless",
    ],
  },
];

/** Catálogo de equipamento adequado ao tipo de viatura. */
export function extrasCatalog(
  vehicleType: "car" | "motorcycle",
): ExtrasGroup[] {
  return vehicleType === "motorcycle"
    ? MOTORCYCLE_EXTRAS_CATALOG
    : EXTRAS_CATALOG;
}

/** Mapa item→categoria construído a partir do catálogo (correspondência exata). */
const CATALOG_INDEX = new Map<string, string>();
/** Ordem de apresentação: primeiro os grupos de carro, depois os de mota. */
const ALL_GROUPS = [...EXTRAS_CATALOG, ...MOTORCYCLE_EXTRAS_CATALOG];
for (const g of ALL_GROUPS) {
  for (const item of g.items) CATALOG_INDEX.set(item.toLowerCase(), g.title);
}

/** Palavras-chave para encaixar extras escritos à mão (texto livre). */
const KEYWORD_RULES: { title: string; keywords: string[] }[] = [
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
      "faixa", "ângulo morto", "angulo morto",
    ],
  },
  {
    title: "Tecnologia e Eletrónica",
    keywords: [
      "câmara", "camara", "camera", "retrovisor", "keyless", "start/stop",
      "start-stop", "arranque", "head-up", "cockpit", "digital", "led",
      "xénon", "xenon", "matrix", "estacion", "park", "cruise", "adaptativo",
      "jante", "distância", "distancia",
    ],
  },
  {
    title: "Conforto",
    keywords: [
      "ac ", "ar condicionado", "climatiz", "banco", "estofo", "pele",
      "apoio de braço", "apoio de braco", "chuva", "teto", "tecto", "vidros",
      "volante", "aquec", "massagem", "memória", "memoria", "solar", "elevador",
      "porta-bagagens", "cortina",
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
    // 1) correspondência exata no catálogo; 2) palavra-chave; 3) "Outros".
    let title = CATALOG_INDEX.get(extra.toLowerCase());
    if (!title) {
      const hay = ` ${extra.toLowerCase()} `;
      title = KEYWORD_RULES.find((r) =>
        r.keywords.some((k) => hay.includes(k)),
      )?.title;
    }
    if (title) {
      const list = buckets.get(title) ?? [];
      list.push(extra);
      buckets.set(title, list);
    } else {
      others.push(extra);
    }
  }

  const groups: ExtrasGroup[] = [];
  for (const g of ALL_GROUPS) {
    const items = buckets.get(g.title);
    if (items && items.length) groups.push({ title: g.title, items });
  }
  if (others.length) groups.push({ title: "Outros equipamentos", items: others });
  return groups;
}
