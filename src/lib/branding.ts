import { site } from "@/lib/site";

/** Dados de contacto/empresa, editáveis no backoffice (site_settings). */
export interface Company {
  /** Telefone formatado para leitura (ex.: "+351 210 000 000"). */
  phone: string;
  /** Href `tel:` já normalizado (sem espaços). */
  phoneHref: string;
  email: string;
  /** Número de WhatsApp só com dígitos (ex.: "351910000000"). */
  whatsapp: string;
  /** Link do Facebook Messenger (ex.: "https://m.me/aminhapagina"). */
  messenger: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  hours: string;
  /** Coordenadas do mapa (Contactos). */
  geo: { lat: number; lng: number };
}

/**
 * Marca do site (nome, logótipo, cores, dados de contacto), editável pelo admin
 * em `site_settings`. Os defaults vêm de `site.ts` / `globals.css` — se nada
 * for definido, o site mantém a identidade original.
 */
export interface Branding {
  companyName: string;
  logoUrl: string | null;
  tagline: string | null;
  /** Cor de acento (o "amarelo" da marca) e a sua variante escura. */
  accent: string;
  accentSoft: string;
  /** ID de medição do Google Analytics 4 (ex.: G-XXXXXXX). */
  ga4Id: string | null;
  /** ID do Meta (Facebook) Pixel. */
  pixelId: string | null;
  /** Reservas online com sinal ativas. */
  reservationEnabled: boolean;
  /** Valor do sinal de reserva, em euros. */
  depositAmount: number;
  /** Dados de contacto/empresa. */
  company: Company;
}

export const DEFAULT_ACCENT = "#E8B15A";
export const DEFAULT_ACCENT_SOFT = "#C8934A";

/** Normaliza um telefone para href `tel:` (mantém dígitos e o "+"). */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Constrói o link do WhatsApp com mensagem pré-preenchida. */
export function waHref(whatsapp: string, message: string): string {
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
}

/** Empresa por defeito — vinda de `site.ts`. */
export const DEFAULT_COMPANY: Company = {
  phone: site.phone,
  phoneHref: site.phoneHref,
  email: site.email,
  whatsapp: site.whatsapp,
  messenger: "",
  address: {
    street: site.address.street,
    city: site.address.city,
    postalCode: site.address.postalCode,
    country: site.address.country,
  },
  hours: site.hours,
  geo: { lat: site.geo.lat, lng: site.geo.lng },
};

export const DEFAULT_BRANDING: Branding = {
  companyName: site.name,
  logoUrl: null,
  tagline: null,
  accent: DEFAULT_ACCENT,
  accentSoft: DEFAULT_ACCENT_SOFT,
  ga4Id: null,
  pixelId: null,
  reservationEnabled: false,
  depositAmount: 500,
  company: DEFAULT_COMPANY,
};
