import { LenisProvider } from "@/components/providers/LenisProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { GrainOverlay } from "@/components/ui/GrainOverlay";

/**
 * Chrome do site PÚBLICO: smooth scroll (Lenis), barra de progresso, grão,
 * header e footer de marketing. O backoffice (`/admin`) não passa por aqui —
 * tem a sua própria layout.
 */
export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <LenisProvider>
      {/* Salto para conteúdo — acessibilidade por teclado. */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
      >
        Saltar para o conteúdo
      </a>
      <ScrollProgress />
      <Header />
      <main id="conteudo">{children}</main>
      <Footer />
      <GrainOverlay />
    </LenisProvider>
  );
}
