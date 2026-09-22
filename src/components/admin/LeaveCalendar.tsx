"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  COMPANY_DAY_LABEL,
  companyCalendar,
  isSelectable,
  isoDay,
  summarise,
  type CompanyDay,
  type LeaveBalance,
  type LeaveDay,
} from "@/lib/leave";
import { removeLeaveDay, submitLeavePlan, toggleLeaveDay } from "@/lib/actions/leave";

/**
 * Calendário anual de férias.
 *
 * Um clique percorre os três estados de um dia: livre → dia inteiro →
 * meio dia → livre. Dias aprovados não se alteram aqui; a alteração passa
 * pelo responsável, senão o plano aprovado deixava de valer.
 */

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];
const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function LeaveCalendar({
  year,
  years,
  balance,
  days,
  extras,
  readOnly = false,
}: {
  year: number;
  years: number[];
  balance: LeaveBalance;
  days: LeaveDay[];
  extras: CompanyDay[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busyDay, setBusyDay] = useState<string | null>(null);

  const calendar = useMemo(() => companyCalendar(year, extras), [year, extras]);
  const marcados = useMemo(
    () => new Map(days.map((d) => [d.day, d])),
    [days],
  );
  const resumo = summarise(balance, days);
  const porSubmeter = days.filter((d) => d.status === "draft").length;

  function clicar(day: string) {
    if (readOnly || pending) return;
    const atual = marcados.get(day);
    if (atual?.status === "approved") {
      toast.error("Dia aprovado. Peça a alteração ao responsável.");
      return;
    }
    setBusyDay(day);
    start(async () => {
      // livre → inteiro → meio → livre
      const res = !atual
        ? await toggleLeaveDay({ day, half: false })
        : !atual.half
          ? await toggleLeaveDay({ day, half: true })
          : await removeLeaveDay(day);
      setBusyDay(null);
      if (!res.ok) toast.error(res.error ?? "Não foi possível alterar o dia.");
      else router.refresh();
    });
  }

  function submeter() {
    start(async () => {
      const res = await submitLeavePlan(year);
      if (res.ok) {
        toast.success("Plano submetido para aprovação.");
        router.refresh();
      } else {
        toast.error(res.error ?? "Não foi possível submeter.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-paper/60">
          Ano{" "}
          <select
            className="field ml-2 inline-block w-auto py-1.5"
            value={year}
            onChange={(e) => router.push(`?ano=${e.target.value}`)}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        {!readOnly && porSubmeter > 0 && (
          <button
            type="button"
            onClick={submeter}
            disabled={pending}
            className="btn-primary h-auto px-5 py-2 text-sm"
          >
            {pending
              ? "A submeter…"
              : `Submeter ${porSubmeter} ${porSubmeter === 1 ? "dia" : "dias"}`}
          </button>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MESES.map((nome, mes) => (
            <Month
              key={nome}
              year={year}
              month={mes}
              label={nome}
              calendar={calendar}
              marcados={marcados}
              busyDay={busyDay}
              onPick={clicar}
              readOnly={readOnly}
            />
          ))}
        </div>

        <aside className="space-y-3">
          <Card titulo="Total de dias" valor={resumo.total} destaque />
          <div className="card overflow-hidden p-0 text-sm">
            <Row label="Férias normais" value={balance.baseDays} />
            <Row label="Férias ano anterior" value={balance.carriedDays} />
            <Row label="Dia de aniversário" value={balance.birthdayDay} />
          </div>
          <Card titulo="Dias marcados" valor={resumo.marked} />
          <Card titulo="Saldo disponível" valor={resumo.available} />
          {resumo.pending > 0 && (
            <p className="px-1 text-xs text-paper/50">
              {fmt(resumo.pending)} à espera de aprovação.
            </p>
          )}
        </aside>
      </div>

      <Legend />
    </div>
  );
}

function Month({
  year,
  month,
  label,
  calendar,
  marcados,
  busyDay,
  onPick,
  readOnly,
}: {
  year: number;
  month: number;
  label: string;
  calendar: Map<string, CompanyDay>;
  marcados: Map<string, LeaveDay>;
  busyDay: string | null;
  onPick: (day: string) => void;
  readOnly: boolean;
}) {
  const primeiro = new Date(year, month, 1);
  const dias = new Date(year, month + 1, 0).getDate();
  // Espaços antes do dia 1 para a coluna certa da semana.
  const vazios = Array.from({ length: primeiro.getDay() });

  return (
    <section className="card p-3">
      <h3 className="mb-2 text-center text-sm font-medium text-paper">
        {label} {year}
      </h3>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] text-paper/40">
        {SEMANA.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-0.5">
        {vazios.map((_, i) => (
          <span key={`v${i}`} />
        ))}
        {Array.from({ length: dias }, (_, i) => {
          const day = isoDay(new Date(year, month, i + 1));
          return (
            <Day
              key={day}
              day={day}
              numero={i + 1}
              especial={calendar.get(day)}
              marcado={marcados.get(day)}
              livre={isSelectable(day, calendar)}
              busy={busyDay === day}
              onPick={onPick}
              readOnly={readOnly}
            />
          );
        })}
      </div>
    </section>
  );
}

function Day({
  day,
  numero,
  especial,
  marcado,
  livre,
  busy,
  onPick,
  readOnly,
}: {
  day: string;
  numero: number;
  especial?: CompanyDay;
  marcado?: LeaveDay;
  livre: boolean;
  busy: boolean;
  onPick: (day: string) => void;
  readOnly: boolean;
}) {
  const estilo = especial
    ? ESPECIAL[especial.kind]
    : marcado
      ? MARCADO[marcado.status]
      : livre
        ? "text-paper/80 hover:bg-white/10"
        : "text-paper/25";

  const titulo = [
    especial ? `${COMPANY_DAY_LABEL[especial.kind]}${especial.label ? `: ${especial.label}` : ""}` : null,
    marcado ? `${marcado.half ? "Meio dia" : "Dia inteiro"} · ${ESTADO[marcado.status]}` : null,
  ]
    .filter(Boolean)
    .join(" — ");

  const conteudo = marcado?.half ? "½" : numero;
  const clicavel = !readOnly && livre;

  return (
    <button
      type="button"
      disabled={!clicavel || busy}
      onClick={() => onPick(day)}
      title={titulo || undefined}
      aria-label={`${numero}${titulo ? ` — ${titulo}` : ""}`}
      className={`grid aspect-square place-items-center rounded text-xs transition-colors ${estilo} ${
        busy ? "animate-pulse" : ""
      } ${clicavel ? "cursor-pointer" : "cursor-default"}`}
    >
      {conteudo}
    </button>
  );
}

const ESPECIAL: Record<CompanyDay["kind"], string> = {
  holiday: "bg-amber-700/80 font-semibold text-white",
  tolerance: "bg-sky-400/80 font-semibold text-ink",
  mandatory: "bg-teal-700/80 font-semibold text-white",
};

const MARCADO: Record<LeaveDay["status"], string> = {
  draft: "bg-white/15 font-semibold text-paper ring-1 ring-dashed ring-white/40",
  pending: "bg-white/25 font-semibold text-paper",
  approved: "bg-slate-600 font-semibold text-white",
  rejected: "text-red-300/70 line-through",
};

const ESTADO: Record<LeaveDay["status"], string> = {
  draft: "por submeter",
  pending: "à espera de aprovação",
  approved: "aprovado",
  rejected: "recusado",
};

function Legend() {
  const itens: [string, string][] = [
    ["bg-amber-700/80", "Feriado"],
    ["bg-sky-400/80", "Tolerância"],
    ["bg-teal-700/80", "Dia obrigatório"],
    ["bg-white/15 ring-1 ring-dashed ring-white/40", "Por submeter"],
    ["bg-white/25", "À espera"],
    ["bg-slate-600", "Plano aprovado"],
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-paper/60">
      {itens.map(([cor, label]) => (
        <span key={label} className="flex items-center gap-2">
          <span className={`h-3 w-3 rounded-sm ${cor}`} aria-hidden />
          {label}
        </span>
      ))}
      <span className="flex items-center gap-2">
        <span className="font-semibold text-paper">½</span> Meio dia
      </span>
    </div>
  );
}

const fmt = (n: number) => n.toLocaleString("pt-PT", { minimumFractionDigits: 1 });

function Card({
  titulo,
  valor,
  destaque = false,
}: {
  titulo: string;
  valor: number;
  destaque?: boolean;
}) {
  return (
    <div className="card flex items-center justify-between gap-3 p-4">
      <p className="text-sm text-paper/60">{titulo}</p>
      <p
        className={`font-semibold ${destaque ? "text-2xl text-accent" : "text-xl text-paper"}`}
      >
        {fmt(valor)}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-2.5 last:border-0">
      <span className="text-paper/60">{label}</span>
      <span className="font-medium text-paper">{fmt(value)}</span>
    </div>
  );
}
