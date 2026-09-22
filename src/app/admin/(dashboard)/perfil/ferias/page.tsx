import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/admin-queries";
import { getBalance, getCompanyDays, getLeaveDays } from "@/lib/leave-queries";
import { LeaveCalendar } from "@/components/admin/LeaveCalendar";

export const dynamic = "force-dynamic";

/** Anos oferecidos no seletor: o anterior, o atual e o seguinte. */
function anos(): number[] {
  const atual = new Date().getFullYear();
  return [atual - 1, atual, atual + 1];
}

export default async function MyLeavePage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>;
}) {
  const me = await getCurrentProfile();
  if (!me) redirect("/admin/login");

  const disponiveis = anos();
  const pedido = Number((await searchParams).ano);
  const year = disponiveis.includes(pedido) ? pedido : new Date().getFullYear();

  const [balance, days, extras] = await Promise.all([
    getBalance(me.id, year),
    getLeaveDays(me.id, year),
    getCompanyDays(year),
  ]);

  return (
    <LeaveCalendar
      year={year}
      years={disponiveis}
      balance={balance}
      days={days}
      extras={extras}
    />
  );
}
