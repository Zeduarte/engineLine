import { getProfiles } from "@/lib/admin-queries";
import { requireSection } from "@/lib/guard";
import { UsersManager, type UserItem } from "@/components/admin/UsersManager";
import { effectiveSections } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const me = await requireSection("utilizadores");

  const profiles = await getProfiles();
  const users: UserItem[] = profiles.map((p) => ({
    id: p.id,
    email: p.email,
    full_name: p.full_name,
    role: p.role,
    allowed_sections: p.allowed_sections,
    created_at: p.created_at,
  }));

  const canManageAuth = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-paper">Utilizadores</h1>
        <p className="mt-1 text-sm text-paper/50">
          Faça a gestão de quem acede ao backoffice e dos separadores a que cada
          um tem acesso. Só pode gerir utilizadores de nível inferior ao seu.
        </p>
      </div>
      <UsersManager
        users={users}
        currentUser={{ id: me.id, role: me.role }}
        managerSections={effectiveSections(me.role, me.allowed_sections)}
        canManageAuth={canManageAuth}
      />
    </>
  );
}
