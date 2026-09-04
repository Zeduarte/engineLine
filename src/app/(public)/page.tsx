import { Hero } from "@/components/hero/Hero";
import { BrandMarquee } from "@/components/home/BrandMarquee";
import { QuickSearch } from "@/components/home/QuickSearch";
import { FeaturedVehicles } from "@/components/home/FeaturedVehicles";
import { PinnedTrust } from "@/components/home/PinnedTrust";
import { SoldShowcase } from "@/components/home/SoldShowcase";
import { ContactCTA } from "@/components/home/ContactCTA";
import { SellCTA } from "@/components/home/SellCTA";
import { Testimonials } from "@/components/home/Testimonials";
import {
  getRecentVehicles,
  getHomeContent,
  getTestimonials,
  getBranding,
  getVehicles,
  getSoldVehicles,
} from "@/lib/queries";
import { getHeroMedia } from "@/lib/hero-media";

// ISR: revalida a cada 60s — novos destaques e edições de conteúdo aparecem
// sem rebuild manual.
export const revalidate = 60;

// Server Component: os dados (destaques + conteúdo editável) são obtidos no
// servidor e passados às ilhas cliente. Zero JS de dados enviado para o browser.
export default async function HomePage() {
  const [recent, content, testimonials, branding, allVehicles, sold] =
    await Promise.all([
      getRecentVehicles(),
      getHomeContent(),
      getTestimonials(),
      getBranding(),
      getVehicles(),
      getSoldVehicles(10),
    ]);

  // Dados mínimos para a pesquisa rápida (marca/modelo/combustível + contagem).
  const searchItems = allVehicles.map((v) => ({
    make: v.make,
    model: v.model,
    fuel: v.fuel,
  }));

  const heroMedia = getHeroMedia();

  return (
    <>
      <Hero
        content={content.hero}
        media={heroMedia}
        search={
          allVehicles.length > 0 ? <QuickSearch vehicles={searchItems} /> : null
        }
      />

      <BrandMarquee brands={content.brands} />
      <FeaturedVehicles vehicles={recent} />
      <SellCTA />
      <PinnedTrust content={content.trust} />
      <SoldShowcase vehicles={sold} />
      <Testimonials items={testimonials} />
      <ContactCTA content={content.cta} company={branding.company} />
    </>
  );
}
