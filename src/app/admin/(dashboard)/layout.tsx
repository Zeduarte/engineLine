import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/admin-queries";
import { Sidebar } from "@/components/admin/Sidebar";
import { MobileNav } from "@/components/admin/MobileNav";

export const dynamic = "force-dynamic";

/**
 * Shell autenticada do backoffice. Dupla proteção (além do middleware): sem
 * sessão → login. Layout de duas colunas em desktop, topo colapsado em mobile.
 */
export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/admin/login");

  const supabase = await createClient();
  const { count } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");

  const user = {
    name: profile.full_name || profile.email || "Utilizador",
    role: profile.role,
  };

  return (
    <div className="min-h-dvh bg-ink text-paper">
      {/* Desktop */}
      <div className="hidden md:grid md:grid-cols-[248px_1fr]">
        <div className="sticky top-0 h-dvh">
          <Sidebar user={user} newLeads={count ?? 0} />
        </div>
        <div className="min-w-0">
          <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">{children}</div>
        </div>
      </div>

      {/* Mobile / tablet */}
      <div className="md:hidden">
        <MobileNav user={user} newLeads={count ?? 0} />
        <div className="px-4 py-6">{children}</div>
      </div>
    </div>
  );
}
