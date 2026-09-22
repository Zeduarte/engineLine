"use client";

import { useRouter } from "next/navigation";
import {
  COMPANY_DAY_LABEL,
  companyCalendar,
  isWeekend,
  isoDay,
  type CompanyDay,
} from "@/lib/leave";
import type { Colleague, TeamLeaveDay } from "@/lib/leave-queries";

/**
 * Mapa de quem está fora, três meses de cada vez.
 *
 * Mostra apenas o dia e o estado — saldos e notas são de cada um. Serve para
 * ver se dois colegas se cruzam antes de marcar, não para auditar ninguém.
 */

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
const INICIAL = ["D", "S", "T", "Q", "Q", "S", "S"];

export function TeamLeaveMap({
  year,
  month,
  colleagues,
  days,
  extras,
  meId,
}: {
  year: number;
  /** Primeiro mês mostrado (0–11). */
  month: number;
  colleagues: Colleague[];
  days: TeamLeaveDay[];
  extras: CompanyDay[];
  meId: string;
}) {
  const router = useRouter();
  const calendar = companyCalendar(year, extras);

  // Três meses a partir do escolhido.
  const blocos = [0, 1, 2].map((n) => {
    const d = new Date(year, month + n, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const colunas = blocos.flatMap((b) =>
    Array.from({ length: new Date(b.year, b.month + 1, 0).getDate() }, (_, i) =>
      isoDay(new Date(b.year, b.month, i + 1)),
    ),
  );

  const porPessoa = new Map<string, Map<string, TeamLeaveDay>>();
  for (const d of days) {
    const linha = porPessoa.get(d.profileId) ?? new Map();
    linha.set(d.day, d);
    porPessoa.set(d.profileId, linha);
  }

  function mover(delta: number) {
    const d = new Date(year, month + delta, 1);
    router.push(`?ano=${d.getFullYear()}&mes=${d.getMonth() + 1}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => mover(-1)} className="btn-ghost h-auto px-3 py-1.5 text-sm">
          ‹ Anterior
        </button>
        <p className="text-sm font-medium text-paper">
          {MESES[blocos[0]!.month]} a {MESES[blocos[2]!.month]} de {blocos[2]!.year}
        </p>
        <button type="button" onClick={() => mover(1)} className="btn-ghost h-auto px-3 py-1.5 text-sm">
          Seguinte ›
        </button>
      </div>

      {colleagues.length === 0 ? (
        <p className="card p-5 text-sm text-paper/60">Ainda não há colegas para mostrar.</p>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-max min-w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-ink-soft px-4 py-2 text-left font-medium text-paper/60">
                  Colaborador
                </th>
                {blocos.map((b) => (
                  <th
                    key={`${b.year}-${b.month}`}
                    colSpan={new Date(b.year, b.month + 1, 0).getDate()}
                    className="border-l border-white/10 px-2 py-2 font-medium text-paper/70"
                  >
                    {MESES[b.month]} {b.year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {colleagues.map((c) => {
                const linha = porPessoa.get(c.id);
                return (
                  <tr key={c.id} className="border-t border-white/5">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 max-w-52 truncate bg-ink-soft px-4 py-2 text-left font-normal text-paper/80"
                    >
                      {c.name}
                      {c.id === meId && (
                        <span className="ml-2 text-[10px] text-accent">você</span>
                      )}
                    </th>
                    {colunas.map((day) => (
                      <Cell
                        key={day}
                        day={day}
                        marcado={linha?.get(day)}
                        especial={calendar.get(day)}
                      />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-paper/60">
        <Chip cor="bg-slate-600" label="Férias aprovadas" />
        <Chip cor="bg-white/25" label="À espera de aprovação" />
        <Chip cor="bg-amber-700/80" label="Feriado" />
        <Chip cor="bg-sky-400/80" label="Tolerância" />
        <Chip cor="bg-teal-700/80" label="Dia obrigatório" />
      </div>
    </div>
  );
}

function Cell({
  day,
  marcado,
  especial,
}: {
  day: string;
  marcado?: TeamLeaveDay;
  especial?: CompanyDay;
}) {
  const numero = Number(day.slice(-2));
  const semana = isWeekend(day);

  const fundo = marcado
    ? marcado.status === "approved"
      ? "bg-slate-600 text-white"
      : "bg-white/25 text-paper"
    : especial
      ? ESPECIAL[especial.kind]
      : semana
        ? "bg-white/5 text-paper/25"
        : "text-paper/40";

  const titulo = marcado
    ? `${marcado.half ? "Meio dia" : "Dia inteiro"} · ${marcado.status === "approved" ? "aprovado" : "à espera"}`
    : especial
      ? `${COMPANY_DAY_LABEL[especial.kind]}${especial.label ? `: ${especial.label}` : ""}`
      : undefined;

  return (
    <td className="p-px">
      <span
        title={titulo}
        className={`grid h-6 w-6 place-items-center rounded text-[10px] ${fundo}`}
      >
        {marcado?.half ? "½" : semana ? INICIAL[weekday(day)] : numero}
      </span>
    </td>
  );
}

/**
 * Dia da semana a partir de `YYYY-MM-DD`. `new Date("2026-09-05")` seria lido
 * como UTC e podia cair no dia anterior — aqui as partes são explícitas.
 */
function weekday(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y!, m! - 1, d!).getDay();
}

const ESPECIAL: Record<CompanyDay["kind"], string> = {
  holiday: "bg-amber-700/80 text-white",
  tolerance: "bg-sky-400/80 text-ink",
  mandatory: "bg-teal-700/80 text-white",
};

function Chip({ cor, label }: { cor: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-sm ${cor}`} aria-hidden />
      {label}
    </span>
  );
}
