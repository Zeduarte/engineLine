import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { site } from "@/lib/site";
import { getBranding } from "@/lib/queries";

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

/**
 * Root layout mínimo: apenas `<html>/<body>`, fontes e o Toaster global.
 * A "chrome" do site público (Header/Footer/Lenis) vive em `(public)/layout`;
 * o backoffice tem a sua própria em `admin/layout`.
 */
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const branding = await getBranding();

  return (
    <html lang="pt-PT" className={inter.variable}>
      <body className="min-h-dvh bg-ink font-sans antialiased">
        {/* Cores da marca escolhidas no backoffice — sobrepõem os defaults. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{--accent:${branding.accent};--accent-soft:${branding.accentSoft};}`,
          }}
        />
        {children}
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "#111112",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#F5F5F4",
            },
          }}
        />
      </body>
    </html>
  );
}
