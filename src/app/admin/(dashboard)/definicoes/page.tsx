import {
  getSiteSettings,
  getCompanySettings,
  getWorkshopRate,
} from "@/lib/admin-queries";
import { requireSection } from "@/lib/guard";
import { BrandingForm } from "@/components/admin/BrandingForm";
import { CompanyForm } from "@/components/admin/CompanyForm";
import { WorkshopSettingsForm } from "@/components/admin/WorkshopSettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireSection("definicoes");

  const [settings, company, workshopRate] = await Promise.all([
    getSiteSettings(),
    getCompanySettings(),
    getWorkshopRate(),
  ]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-paper">Definições</h1>
        <p className="mt-1 text-sm text-paper/50">
          Marca e dados de contacto do site. Só administradores podem alterar.
        </p>
      </div>

      <BrandingForm initial={settings} />

      <div className="mt-10 mb-6 border-t border-white/10 pt-8">
        <h2 className="text-lg font-semibold text-paper">Dados da empresa</h2>
        <p className="mt-1 text-sm text-paper/50">
          Telefone, email, morada e horário — usados no rodapé, contactos,
          WhatsApp e ficha das viaturas.
        </p>
      </div>

      <CompanyForm initial={company} />

      <div className="mt-10 mb-6 border-t border-white/10 pt-8">
        <h2 className="text-lg font-semibold text-paper">Oficina</h2>
        <p className="mt-1 text-sm text-paper/50">
          Valor/hora da mão de obra — converte as horas da Oficina em custo nas
          margens.
        </p>
      </div>

      <WorkshopSettingsForm initialRate={workshopRate} />
    </>
  );
}
