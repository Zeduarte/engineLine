import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * Web App Manifest (PWA). Permite "Adicionar ao ecrã inicial" no telemóvel,
 * com ícone, nome e cores próprias. Servido em `/manifest.webmanifest`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — Automóveis Premium`,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A0A",
    theme_color: "#0A0A0A",
    lang: "pt-PT",
    categories: ["shopping", "business"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
