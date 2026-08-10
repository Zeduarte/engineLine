import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/queries";
import { site } from "@/lib/site";

export const revalidate = 300;

/** Sitemap gerado dinamicamente a partir das rotas estáticas + viaturas. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllSlugs();
  const now = new Date();

  const staticRoutes = ["", "/inventario", "/vender", "/sobre", "/contactos"].map(
    (path) => ({
      url: `${site.url}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    }),
  );

  const vehicleRoutes = slugs.map((slug) => ({
    url: `${site.url}/viaturas/${slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...vehicleRoutes];
}
