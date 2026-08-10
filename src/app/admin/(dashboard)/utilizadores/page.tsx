import { redirect } from "next/navigation";
import { getCurrentProfile, getProfiles } from "@/lib/admin-queries";
import { UsersManager, type UserItem } from "@/components/admin/UsersManager";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/admin/login");
  if (profile.role !== "admin") redirect("/admin");

  const profiles = await getProfiles();
  const users: UserItem[] = profiles.map((p) => ({
    id: p.id,
    email: p.email,
    full_name: p.full_name,
    role: p.role,
    created_at: p.created_at,
  }));

  const canManageAuth = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-paper">Utilizadores</h1>
        <p className="mt-1 text-sm text-paper/50">
          Faça a gestão de quem acede ao backoffice e das suas permissões.
        </p>
      </div>
      <UsersManager
        users={users}
        currentUserId={profile.id}
        canManageAuth={canManageAuth}
      />
    </>
  );
}
