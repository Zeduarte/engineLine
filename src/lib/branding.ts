import { site } from "@/lib/site";
import { normalizeWhatsApp } from "@/lib/phone";

export { normalizeWhatsApp };

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
  return `https://wa.me/${normalizeWhatsApp(whatsapp)}?text=${encodeURIComponent(message)}`;
}

/** O que um ponto de venda sabe dizer sobre os contactos. */
export interface PointContacts {
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  hours: string;
  latitude: number | null;
  longitude: number | null;
}

/**
 * Os contactos da empresa vêm do ponto de venda principal (o primeiro em
 * Página inicial → Pontos de venda): é aí que se editam, num só sítio. Um
 * campo vazio no ponto mantém o que havia, para nada ficar em branco no site.
 * WhatsApp e Messenger não existem nos pontos e mantêm-se.
 */
export function companyFromPoint(company: Company, point: PointContacts | undefined): Company {
  if (!point) return company;
  const phone = point.phone.trim() || company.phone;
  return {
    ...company,
    phone,
    phoneHref: telHref(phone),
    email: point.email.trim() || company.email,
    address: {
      ...company.address,
      street: point.address.trim() || company.address.street,
      city: point.city.trim() || company.address.city,
      postalCode: point.postalCode.trim() || company.address.postalCode,
    },
    hours: point.hours.trim() || company.hours,
    geo:
      point.latitude !== null && point.longitude !== null
        ? { lat: point.latitude, lng: point.longitude }
        : company.geo,
  };
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
