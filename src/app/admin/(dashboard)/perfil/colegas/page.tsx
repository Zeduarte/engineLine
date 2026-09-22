import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/admin-queries";
import { getColleagues, getCompanyDays, getTeamLeave } from "@/lib/leave-queries";
import { TeamLeaveMap } from "@/components/admin/TeamLeaveMap";
import { isoDay } from "@/lib/leave";

export const dynamic = "force-dynamic";

export default async function TeamLeavePage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; mes?: string }>;
}) {
  const me = await getCurrentProfile();
  if (!me) redirect("/admin/login");

  const hoje = new Date();
  const params = await searchParams;
  const ano = Number(params.ano);
  const mes = Number(params.mes);
  const year = ano >= 2000 && ano <= 2100 ? ano : hoje.getFullYear();
  const month = mes >= 1 && mes <= 12 ? mes - 1 : hoje.getMonth();

  // A janela do mapa são três meses; os dias especiais podem cair no ano
  // seguinte, por isso pedem-se os dois.
  const inicio = new Date(year, month, 1);
  const fim = new Date(year, month + 3, 0);
  const [colleagues, days, extrasA, extrasB] = await Promise.all([
    getColleagues(),
    getTeamLeave(isoDay(inicio), isoDay(fim)),
    getCompanyDays(year),
    getCompanyDays(fim.getFullYear()),
  ]);

  return (
    <TeamLeaveMap
      year={year}
      month={month}
      colleagues={colleagues}
      days={days}
      extras={year === fim.getFullYear() ? extrasA : [...extrasA, ...extrasB]}
      meId={me.id}
    />
  );
}
