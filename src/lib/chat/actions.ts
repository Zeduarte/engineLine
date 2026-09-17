import type { Branding } from "@/lib/branding";
import { waHref } from "@/lib/branding";

/**
 * Encaminhamento do assistente virtual.
 *
 * O bot não recolhe dados pessoais: quando deteta intenção real, termina a
 * resposta com um marcador `[[ACOES: ...]]` e o servidor converte-o em botões
 * para os fluxos que o site já tem (painel "Interessado?", /vender, /contactos,
 * WhatsApp, telefone). Assim os destinos são sempre válidos — o modelo escolhe
 * de uma lista fechada em vez de inventar URLs.
 */

export interface ChatAction {
  label: string;
  /** Caminho interno, `tel:` ou URL externa. */
  href: string;
  /**
   * Quando presente, o cliente faz scroll até ao elemento visível com este
   * atributo `data-*` em vez de navegar (já estamos na página certa).
   */
  scrollTo?: string;
}

/** Nomes que o modelo pode usar no marcador, além de `viatura:<slug>`. */
export const ACTION_KEYS = [
  "interessado",
  "inventario",
  "vender",
  "contactos",
  "whatsapp",
  "telefone",
] as const;

export type ActionKey = (typeof ACTION_KEYS)[number];

/** Marcador no fim da resposta, ex.: `[[ACOES: interessado, contactos]]`. */
const MARKER = /\[\[ACOES:([^\]]*)\]\]/i;

/**
 * Separa o texto visível dos nomes de ação pedidos pelo modelo. O marcador é
 * removido do texto — nunca chega ao visitante.
 */
export function splitActionMarker(text: string): {
  text: string;
  keys: string[];
} {
  const match = text.match(MARKER);
  if (!match) return { text: text.trimEnd(), keys: [] };
  const keys = (match[1] ?? "")
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
  return { text: text.replace(MARKER, "").trimEnd(), keys };
}

/**
 * Converte os nomes em botões. `allowedSlugs` são as viaturas que o servidor
 * realmente devolveu nesta conversa — impede links para slugs inventados.
 */
export function resolveActions(
  keys: string[],
  branding: Branding,
  allowedSlugs: Map<string, string>,
  onVehiclePage: boolean,
): ChatAction[] {
  const { company } = branding;
  const out: ChatAction[] = [];
  const seen = new Set<string>();

  for (const key of keys) {
    if (seen.has(key)) continue;
    seen.add(key);

    if (key.startsWith("viatura:")) {
      const slug = key.slice("viatura:".length);
      const label = allowedSlugs.get(slug);
      if (label) out.push({ label: `Ver ${label}`, href: `/viaturas/${slug}` });
      continue;
    }

    switch (key as ActionKey) {
      case "interessado":
        // Só faz sentido numa ficha — é lá que o painel existe.
        if (onVehiclePage)
          out.push({
            label: "Falar sobre esta viatura",
            href: "#",
            scrollTo: "interessado",
          });
        break;
      case "inventario":
        out.push({ label: "Ver todo o stock", href: "/inventario" });
        break;
      case "vender":
        out.push({ label: "Vender ou retomar o meu carro", href: "/vender" });
        break;
      case "contactos":
        out.push({ label: "Contactos e morada", href: "/contactos" });
        break;
      case "whatsapp":
        if (company.whatsapp)
          out.push({
            label: "Falar por WhatsApp",
            href: waHref(
              company.whatsapp,
              "Olá! Estive a falar com o assistente do site e gostava de mais informações.",
            ),
          });
        break;
      case "telefone":
        if (company.phone)
          out.push({ label: `Ligar ${company.phone}`, href: company.phoneHref });
        break;
    }
  }

  return out.slice(0, 3);
}
