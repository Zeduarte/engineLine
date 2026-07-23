import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

// next/font: auto-host, sem pedido a terceiros, sem layout shift. Exposto
// como CSS var e consumido pelo Tailwind (font-sans).
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Automóveis Premium em Portugal`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "pt_PT",
    siteName: site.name,
    title: `${site.name} — Automóveis Premium`,
    description: site.description,
    url: site.url,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT" className={inter.variable}>
      <body className="min-h-dvh bg-ink font-sans antialiased">
        {/* Salto para conteúdo — acessibilidade por teclado. */}
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
        >
          Saltar para o conteúdo
        </a>
        <LenisProvider>
          <Header />
          <main id="conteudo">{children}</main>
          <Footer />
        </LenisProvider>
      </body>
    </html>
  );
}
