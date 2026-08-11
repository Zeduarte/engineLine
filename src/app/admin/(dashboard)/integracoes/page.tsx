import { redirect } from "next/navigation";
import {
  getCurrentProfile,
  getSiteSettings,
  getIntegrations,
} from "@/lib/admin-queries";
import { MarketingForm } from "@/components/admin/MarketingForm";
import {
  IntegrationsForm,
  type IntegrationsInitial,
} from "@/components/admin/IntegrationsForm";
import { FeedUrls } from "@/components/admin/FeedUrls";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/admin/login");
  if (profile.role !== "admin") redirect("/admin");

  const [settings, integrations] = await Promise.all([
    getSiteSettings(),
    getIntegrations(),
  ]);

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || site.url;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-paper">Integrações</h1>
        <p className="mt-1 text-sm text-paper/50">
          Exportação para portais, pagamentos e rastreio. Só administradores.
        </p>
      </div>

      <div className="space-y-6">
        <MarketingForm
          initial={{
            ga4_id: settings.ga4_id,
            pixel_id: settings.pixel_id,
            reservation_enabled: settings.reservation_enabled,
            deposit_amount: settings.deposit_amount,
          }}
        />
        <IntegrationsForm initial={integrations as IntegrationsInitial} />
        <FeedUrls baseUrl={baseUrl} />
      </div>
    </>
  );
}
