import { redirect } from "next/navigation";
import {
  getCurrentProfile,
  getSiteSettings,
  getCompanySettings,
} from "@/lib/admin-queries";
import { BrandingForm } from "@/components/admin/BrandingForm";
import { CompanyForm } from "@/components/admin/CompanyForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/admin/login");
  if (profile.role !== "admin") redirect("/admin");

  const [settings, company] = await Promise.all([
    getSiteSettings(),
    getCompanySettings(),
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
    </>
  );
}
