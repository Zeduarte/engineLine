import { LenisProvider } from "@/components/providers/LenisProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { GrainOverlay } from "@/components/ui/GrainOverlay";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { CompareProvider } from "@/components/inventory/CompareContext";
import { CompareBar } from "@/components/inventory/CompareBar";
import { getBranding } from "@/lib/queries";

/**
 * Chrome do site PÚBLICO: smooth scroll (Lenis), barra de progresso, grão,
 * header e footer de marketing. A marca (nome/logo) vem da BD (editável pelo
 * admin). O backoffice (`/admin`) não passa por aqui — tem a sua própria layout.
 */
export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const branding = await getBranding();

  return (
    <LenisProvider>
      <CompareProvider>
        {/* Salto para conteúdo — acessibilidade por teclado. */}
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
        >
          Saltar para o conteúdo
        </a>
        <ScrollProgress />
        <Header branding={branding} />
        <main id="conteudo">{children}</main>
        <Footer branding={branding} />
        <WhatsAppButton />
        <CompareBar />
        <GrainOverlay />
      </CompareProvider>
    </LenisProvider>
  );
}
