import { site } from "@/lib/site";

/**
 * Marca do site (nome + logótipo), editável pelo admin em `site_settings`.
 * Os defaults vêm de `site.ts` — se nada for definido, o site mantém a marca
 * original.
 */
export interface Branding {
  companyName: string;
  logoUrl: string | null;
  tagline: string | null;
}

export const DEFAULT_BRANDING: Branding = {
  companyName: site.name,
  logoUrl: null,
  tagline: null,
};
