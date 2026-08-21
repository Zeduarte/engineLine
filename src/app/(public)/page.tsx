import { Hero } from "@/components/hero/Hero";
import { BrandMarquee } from "@/components/home/BrandMarquee";
import { QuickSearch } from "@/components/home/QuickSearch";
import { FeaturedVehicles } from "@/components/home/FeaturedVehicles";
import { PinnedTrust } from "@/components/home/PinnedTrust";
import { ContactCTA } from "@/components/home/ContactCTA";
import { SellCTA } from "@/components/home/SellCTA";
import { Testimonials } from "@/components/home/Testimonials";
import {
  getRecentVehicles,
  getHomeContent,
  getTestimonials,
  getBranding,
  getVehicles,
} from "@/lib/queries";

// ISR: revalida a cada 60s — novos destaques e edições de conteúdo aparecem
// sem rebuild manual.
export const revalidate = 60;

// Server Component: os dados (destaques + conteúdo editável) são obtidos no
// servidor e passados às ilhas cliente. Zero JS de dados enviado para o browser.
export default async function HomePage() {
  const [recent, content, testimonials, branding, allVehicles] =
    await Promise.all([
      getRecentVehicles(),
      getHomeContent(),
      getTestimonials(),
      getBranding(),
      getVehicles(),
    ]);

  // Opções para a pesquisa rápida (marca → modelos → combustível).
  const makes = [...new Set(allVehicles.map((v) => v.make))].sort((a, b) =>
    a.localeCompare(b, "pt"),
  );
  const modelsByMake: Record<string, string[]> = {};
  for (const v of allVehicles) {
    const list = (modelsByMake[v.make] ??= []);
    if (!list.includes(v.model)) list.push(v.model);
  }
  const fuels = [...new Set(allVehicles.map((v) => v.fuel))];

  return (
    <>
      <Hero content={content.hero} />

      {allVehicles.length > 0 && (
        <div className="container-px -mt-8 md:-mt-12">
          <QuickSearch
            makes={makes}
            modelsByMake={modelsByMake}
            fuels={fuels}
          />
        </div>
      )}

      <BrandMarquee brands={content.brands} />
      <FeaturedVehicles vehicles={recent} />
      <PinnedTrust content={content.trust} />
      <Testimonials items={testimonials} />
      <SellCTA />
      <ContactCTA content={content.cta} company={branding.company} />
    </>
  );
}
