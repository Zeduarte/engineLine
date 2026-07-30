import { Hero } from "@/components/hero/Hero";
import { FeaturedVehicles } from "@/components/home/FeaturedVehicles";
import { PinnedTrust } from "@/components/home/PinnedTrust";
import { ContactCTA } from "@/components/home/ContactCTA";
import { getFeaturedVehicles } from "@/lib/queries";

// ISR: revalida a cada 60s — novos destaques aparecem sem rebuild manual.
export const revalidate = 60;

// Server Component: os dados são obtidos no servidor e passados às ilhas
// cliente (Hero, cards). Zero JS de dados enviado para o browser.
export default async function HomePage() {
  const featured = await getFeaturedVehicles();

  return (
    <>
      <Hero />
      <FeaturedVehicles vehicles={featured} />
      <PinnedTrust />
      <ContactCTA />
    </>
  );
}
