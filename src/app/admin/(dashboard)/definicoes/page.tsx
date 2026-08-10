import { redirect } from "next/navigation";
import { getCurrentProfile, getSiteSettings } from "@/lib/admin-queries";
import { BrandingForm } from "@/components/admin/BrandingForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/admin/login");
  if (profile.role !== "admin") redirect("/admin");

  const settings = await getSiteSettings();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-paper">Definições</h1>
        <p className="mt-1 text-sm text-paper/50">
          Marca do site — nome e logótipo. Só administradores podem alterar.
        </p>
      </div>
      <BrandingForm initial={settings} />
    </>
  );
}
