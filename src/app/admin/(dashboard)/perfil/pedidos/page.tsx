import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/admin-queries";
import { getPendingRequests } from "@/lib/leave-queries";
import { LeaveRequests } from "@/components/admin/LeaveRequests";

export const dynamic = "force-dynamic";

export default async function LeaveRequestsPage() {
  const me = await getCurrentProfile();
  if (!me) redirect("/admin/login");
  // Só quem decide férias entra aqui; os outros nem veem o separador.
  if (me.role !== "admin" && me.role !== "chefe") redirect("/admin/perfil");

  return <LeaveRequests requests={await getPendingRequests()} />;
}
