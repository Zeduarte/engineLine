import { site } from "@/lib/site";

/**
 * Marca do site (nome, logótipo, cores), editável pelo admin em `site_settings`.
 * Os defaults vêm de `site.ts` / `globals.css` — se nada for definido, o site
 * mantém a identidade original.
 */
export interface Branding {
  companyName: string;
  logoUrl: string | null;
  tagline: string | null;
  /** Cor de acento (o "amarelo" da marca) e a sua variante escura. */
  accent: string;
  accentSoft: string;
}

export const DEFAULT_ACCENT = "#E8B15A";
export const DEFAULT_ACCENT_SOFT = "#C8934A";

export const DEFAULT_BRANDING: Branding = {
  companyName: site.name,
  logoUrl: null,
  tagline: null,
  accent: DEFAULT_ACCENT,
  accentSoft: DEFAULT_ACCENT_SOFT,
};
