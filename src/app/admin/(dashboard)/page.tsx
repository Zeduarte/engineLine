import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getAdminCars, getDashboardStats, getCurrentProfile } from "@/lib/admin-queries";
import { coverImage } from "@/lib/mappers";
import { formatPrice, priceLabel } from "@/lib/format";
import { InventoryCharts } from "@/components/admin/InventoryCharts";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState } from "@/components/admin/EmptyState";

export const dynamic = "force-dynamic";

function Kpi({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-paper/40">
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-bold ${accent ? "text-accent" : "text-paper"}`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-paper/50">{hint}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  // O mecânico não tem dashboard — vai direto para a Oficina.
  const profile = await getCurrentProfile();
  if (profile?.role === "mecanico") redirect("/admin/oficina");

  const [stats, cars] = await Promise.all([
    getDashboardStats(),
    getAdminCars(),
  ]);

  if (stats.total === 0) {
    return (
      <>
        <Header />
        <EmptyState />
      </>
    );
  }

  const recent = cars.slice(0, 6);

  return (
    <>
      <Header />

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Total de viaturas"
          value={String(stats.total)}
          hint={`${stats.createdThisMonth} criadas este mês`}
        />
        <Kpi label="Publicadas" value={String(stats.published)} />
        <Kpi
          label="Reservadas"
          value={String(stats.reserved)}
          hint={`${stats.sold} vendidas`}
        />
        <Kpi
          label="Leads novos"
          value={String(stats.newLeads)}
          accent={stats.newLeads > 0}
        />
        <Kpi
          label="Valor do stock"
          value={formatPrice(stats.inventoryValue)}
          hint="Publicadas + reservadas"
        />
        <Kpi label="Preço médio" value={formatPrice(stats.avgPrice)} />
        <Kpi label="Rascunhos" value={String(stats.draft)} />
        <Kpi
          label="Vendas este mês"
          value={String(stats.soldThisMonth)}
          accent={stats.soldThisMonth > 0}
        />
        <Kpi
          label="Visitas às fichas"
          value={String(stats.totalViews)}
          hint={`${stats.viewsThisMonth} este mês`}
        />
        <Kpi
          label="Taxa de contacto"
          value={`${stats.contactRate}%`}
          hint={`${stats.totalLeads} leads / ${stats.totalViews} visitas`}
          accent={stats.contactRate > 0}
        />
      </section>

      {stats.topViewed.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-paper">
            Viaturas mais vistas
          </h2>
          <div className="card divide-y divide-white/5">
            {stats.topViewed.map((v, i) => (
              <div
                key={v.slug || i}
                className="flex items-center gap-4 p-3 text-sm"
              >
                <span className="w-6 text-center font-bold text-paper/30">
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-paper">{v.name}</span>
                <span className="font-semibold text-accent">
                  {v.views} {v.views === 1 ? "visita" : "visitas"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {stats.conversion.length > 0 && (
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-paper">
              Conversão por viatura
            </h2>
            <p className="mt-1 text-xs text-paper/50">
              Visitas → leads. Muitas visitas com poucos contactos podem indicar
              preço ou fotos a rever.
            </p>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-paper/40">
                  <th className="p-3 font-medium">Viatura</th>
                  <th className="p-3 text-right font-medium">Visitas</th>
                  <th className="p-3 text-right font-medium">Leads</th>
                  <th className="p-3 text-right font-medium">Conversão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.conversion.map((c) => (
                  <tr key={c.slug || c.name}>
                    <td className="p-3">
                      <Link
                        href={`/viaturas/${c.slug}`}
                        className="text-paper hover:text-accent"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="p-3 text-right tabular-nums text-paper/80">
                      {c.views}
                    </td>
                    <td className="p-3 text-right tabular-nums text-paper/80">
                      {c.leads}
                    </td>
                    <td
                      className={`p-3 text-right font-semibold tabular-nums ${
                        c.leads > 0 ? "text-accent" : "text-paper/40"
                      }`}
                    >
                      {c.rate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="mt-8">
        <InventoryCharts stats={stats} />
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-paper">
            Últimas viaturas editadas
          </h2>
          <Link
            href="/admin/carros"
            className="text-sm text-accent hover:underline"
          >
            Ver todas →
          </Link>
        </div>
        <div className="card divide-y divide-white/5">
          {recent.map((car) => {
            const cover = coverImage(car);
            return (
              <Link
                key={car.id}
                href={`/admin/carros/${car.id}`}
                className="flex items-center gap-4 p-3 transition-colors hover:bg-white/5"
              >
                <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-muted">
                  <Image
                    src={cover.src}
                    alt={cover.alt}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-paper">
                    {car.make} {car.model}
                    {car.variant ? ` ${car.variant}` : ""}
                  </p>
                  <p className="text-xs text-paper/50">
                    {car.year} · {car.fuel}
                  </p>
                </div>
                <p className="hidden text-sm font-semibold text-accent sm:block">
                  {priceLabel(car.price ?? 0, car.price_on_request)}
                </p>
                <StatusBadge status={car.status} />
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}

function Header() {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-paper">Dashboard</h1>
        <p className="mt-1 text-sm text-paper/50">
          Visão geral do stock e da atividade recente.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/admin/carros/novo" className="btn-primary">
          ＋ Nova viatura
        </Link>
        <Link href="/admin/carros" className="btn-ghost">
          Gerir viaturas
        </Link>
      </div>
    </div>
  );
}
