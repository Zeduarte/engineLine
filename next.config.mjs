/** @type {import('next').NextConfig} */

// Quando publicamos no GitHub Pages, o build corre em modo de exportação
// estática (`EXPORT=true`) e o site vive num subcaminho (`/nome-do-repo`),
// injetado via `NEXT_PUBLIC_BASE_PATH`. Localmente estas variáveis não existem,
// por isso o `next dev`/`next build` normais não são afetados.
const isExport = process.env.EXPORT === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  ...(isExport ? { output: "export" } : {}),
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  images: {
    // A exportação estática não tem servidor de otimização de imagens.
    unoptimized: isExport,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["framer-motion", "gsap"],
  },
  // As imagens e vídeos de public/ são servidos pela CDN; nunca devem ir dentro
  // da função do servidor (o Netlify recusa funções com mais de 250 MB).
  outputFileTracingExcludes: {
    "*": ["public/**/*"],
  },
};

export default nextConfig;
