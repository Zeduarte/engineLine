import { Hero } from "@/components/hero/Hero";
import { BrandMarquee } from "@/components/home/BrandMarquee";
import { FeaturedVehicles } from "@/components/home/FeaturedVehicles";
import { PinnedTrust } from "@/components/home/PinnedTrust";
import { ContactCTA } from "@/components/home/ContactCTA";
import { getFeaturedVehicles } from "@/lib/vehicles";

// Server Component: os dados são obtidos no servidor e passados às ilhas
// cliente (Hero, cards). Zero JS de dados enviado para o browser.
export default async function HomePage() {
  const featured = await getFeaturedVehicles();

  return (
    <>
      <Hero />
      <BrandMarquee />
      <FeaturedVehicles vehicles={featured} />
      <PinnedTrust />
      <ContactCTA />
    </>
  );
}
