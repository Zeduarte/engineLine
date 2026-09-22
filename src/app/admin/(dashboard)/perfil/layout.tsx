import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/admin-queries";
import { ProfileTabs } from "@/components/admin/ProfileTabs";

export const dynamic = "force-dynamic";

/**
 * Área pessoal. Ao contrário do resto do backoffice, não depende de um
 * separador de permissões: toda a gente tem perfil e férias — inclusive o
 * mecânico, que só vê a Oficina no menu.
 */
export default async function ProfileLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const me = await getCurrentProfile();
  if (!me) redirect("/admin/login");
  const canApprove = me.role === "admin" || me.role === "chefe";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-paper">
          {me.full_name || me.email}
        </h1>
        <p className="mt-1 text-sm capitalize text-paper/50">{me.role}</p>
      </div>
      <ProfileTabs canApprove={canApprove} />
      {children}
    </div>
  );
}
