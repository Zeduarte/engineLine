import { normalizeWhatsApp } from "./phone";

/** Constantes de marca e contactos — um único sítio para editar. */

export const site = {
  name: "Supermotas",
  legalName: "Supermotas — Motas e Automóveis",
  description:
    "Stand de motas e automóveis em Portugal. Viaturas selecionadas, histórico transparente e uma experiência de compra sem fricção.",
  url: "https://supermotas.netlify.app",
  phone: "+351 210 000 000",
  phoneHref: "tel:+351210000000",
  whatsapp: "351910000000",
  email: "geral@supermotas.pt",
  address: {
    street: "Av. da Liberdade 100",
    city: "Lisboa",
    postalCode: "1250-096",
    country: "Portugal",
  },
  // Coordenadas usadas no mapa (Av. da Liberdade, Lisboa).
  geo: { lat: 38.7223, lng: -9.1447 },
  hours: "Seg–Sáb · 09h00–19h00",
  accent: "#E8B15A",
} as const;

export function whatsappHref(message: string): string {
  return `https://wa.me/${normalizeWhatsApp(site.whatsapp)}?text=${encodeURIComponent(message)}`;
}
