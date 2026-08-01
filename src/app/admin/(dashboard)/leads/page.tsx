import { getLeads } from "@/lib/admin-queries";
import { LeadsTable } from "@/components/admin/LeadsTable";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-paper">Leads</h1>
        <p className="mt-1 text-sm text-paper/50">
          Pedidos de contacto e test drive recebidos pelo site.
        </p>
      </div>
      <LeadsTable
        leads={leads.map((l) => ({
          id: l.id,
          kind: l.kind,
          status: l.status,
          name: l.name,
          email: l.email,
          phone: l.phone,
          message: l.message,
          car_label: l.car_label,
          preferred_date: l.preferred_date,
          created_at: l.created_at,
        }))}
      />
    </>
  );
}
