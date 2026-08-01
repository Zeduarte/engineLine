import { Hero } from "@/components/hero/Hero";
import { BrandMarquee } from "@/components/home/BrandMarquee";
import { FeaturedVehicles } from "@/components/home/FeaturedVehicles";
import { PinnedTrust } from "@/components/home/PinnedTrust";
import { ContactCTA } from "@/components/home/ContactCTA";
import { getRecentVehicles, getHomeContent } from "@/lib/queries";

// ISR: revalida a cada 60s — novos destaques e edições de conteúdo aparecem
// sem rebuild manual.
export const revalidate = 60;

// Server Component: os dados (destaques + conteúdo editável) são obtidos no
// servidor e passados às ilhas cliente. Zero JS de dados enviado para o browser.
export default async function HomePage() {
  const [recent, content] = await Promise.all([
    getRecentVehicles(),
    getHomeContent(),
  ]);

  return (
    <>
      <Hero content={content.hero} />
      <BrandMarquee brands={content.brands} />
      <FeaturedVehicles vehicles={recent} />
      <PinnedTrust content={content.trust} />
      <ContactCTA content={content.cta} />
    </>
  );
}
