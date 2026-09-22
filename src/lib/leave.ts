/**
 * Regras de férias.
 *
 * Sem dependências do Next nem do Supabase — são contas puras, testáveis à
 * parte. As datas andam sempre como `YYYY-MM-DD` para não haver surpresas com
 * fusos horários: um dia de férias é um dia do calendário, não um instante.
 */

export type LeaveStatus = "draft" | "pending" | "approved" | "rejected";
export type CompanyDayKind = "holiday" | "tolerance" | "mandatory";

export interface LeaveDay {
  day: string;
  half: boolean;
  status: LeaveStatus;
}

export interface CompanyDay {
  day: string;
  kind: CompanyDayKind;
  label: string;
}

export interface LeaveBalance {
  /** Dias de férias do próprio ano. */
  baseDays: number;
  /** Dias transitados do ano anterior. */
  carriedDays: number;
  /** Dia de aniversário (0 ou 1). */
  birthdayDay: number;
}

export const DEFAULT_BALANCE: LeaveBalance = {
  baseDays: 22,
  carriedDays: 0,
  birthdayDay: 1,
};

export const STATUS_LABEL: Record<LeaveStatus, string> = {
  draft: "Por submeter",
  pending: "À espera de aprovação",
  approved: "Aprovado",
  rejected: "Recusado",
};

export const COMPANY_DAY_LABEL: Record<CompanyDayKind, string> = {
  holiday: "Feriado",
  tolerance: "Tolerância",
  mandatory: "Dia obrigatório",
};

/** `YYYY-MM-DD` de uma data, no calendário e não em UTC. */
export function isoDay(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

/**
 * Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher, calendário gregoriano).
 * Dele saem a Sexta-feira Santa, o Corpo de Deus e o Carnaval.
 */
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function shift(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Feriados nacionais portugueses do ano.
 *
 * Os fixos mais os que dependem da Páscoa. O Carnaval não é feriado nacional
 * obrigatório — fica de fora, e o stand acrescenta-o como tolerância se o der.
 */
export function nationalHolidays(year: number): CompanyDay[] {
  const easter = easterSunday(year);
  const fixos: [number, number, string][] = [
    [1, 1, "Ano Novo"],
    [4, 25, "Dia da Liberdade"],
    [5, 1, "Dia do Trabalhador"],
    [6, 10, "Dia de Portugal"],
    [8, 15, "Assunção de Nossa Senhora"],
    [10, 5, "Implantação da República"],
    [11, 1, "Todos os Santos"],
    [12, 1, "Restauração da Independência"],
    [12, 8, "Imaculada Conceição"],
    [12, 25, "Natal"],
  ];

  const moveis: [Date, string][] = [
    [shift(easter, -2), "Sexta-feira Santa"],
    [easter, "Páscoa"],
    [shift(easter, 60), "Corpo de Deus"],
  ];

  return [
    ...fixos.map(([mes, dia, label]) => ({
      day: isoDay(new Date(year, mes - 1, dia)),
      kind: "holiday" as const,
      label,
    })),
    ...moveis.map(([date, label]) => ({
      day: isoDay(date),
      kind: "holiday" as const,
      label,
    })),
  ].sort((a, b) => a.day.localeCompare(b.day));
}

/**
 * Todos os dias especiais do ano: nacionais mais os que o stand acrescentou.
 * Um dia definido no backoffice substitui o nacional com a mesma data — é o
 * stand que sabe se nesse ano abre ou fecha.
 */
export function companyCalendar(
  year: number,
  extras: CompanyDay[],
): Map<string, CompanyDay> {
  const mapa = new Map<string, CompanyDay>();
  for (const d of nationalHolidays(year)) mapa.set(d.day, d);
  for (const d of extras) {
    if (d.day.startsWith(String(year))) mapa.set(d.day, d);
  }
  return mapa;
}

/** Fim de semana? Sábado e domingo não consomem dias de férias. */
export function isWeekend(day: string): boolean {
  const [y, m, d] = day.split("-").map(Number);
  const wd = new Date(y!, m! - 1, d!).getDay();
  return wd === 0 || wd === 6;
}

/**
 * Um dia pode ser marcado como férias?
 *
 * Fins de semana e feriados não — já não se trabalha. Tolerâncias também não.
 * Os dias obrigatórios são marcados pela empresa, não pelo colaborador.
 */
export function isSelectable(
  day: string,
  calendar: Map<string, CompanyDay>,
): boolean {
  if (isWeekend(day)) return false;
  const especial = calendar.get(day);
  return !especial || especial.kind === "mandatory";
}

/** Quanto vale um dia marcado: meio dia conta 0,5. */
export function dayValue(d: Pick<LeaveDay, "half">): number {
  return d.half ? 0.5 : 1;
}

export interface LeaveSummary {
  /** Total de dias a que tem direito. */
  total: number;
  /** Dias marcados (aprovados, submetidos e rascunhos). */
  marked: number;
  /** Dias já aprovados. */
  approved: number;
  /** Dias à espera de decisão. */
  pending: number;
  /** Total menos marcados. Pode ser negativo se marcar a mais. */
  available: number;
}

/**
 * Contas do ano. Recusados não contam — o dia voltou a estar disponível.
 * Os dias obrigatórios da empresa entram como marcados, porque saem do saldo.
 */
export function summarise(
  balance: LeaveBalance,
  days: LeaveDay[],
): LeaveSummary {
  const round = (n: number) => Math.round(n * 10) / 10;
  const conta = (f: (d: LeaveDay) => boolean) =>
    round(days.filter(f).reduce((n, d) => n + dayValue(d), 0));

  const total = round(
    balance.baseDays + balance.carriedDays + balance.birthdayDay,
  );
  const marked = conta((d) => d.status !== "rejected");

  return {
    total,
    marked,
    approved: conta((d) => d.status === "approved"),
    pending: conta((d) => d.status === "pending"),
    available: round(total - marked),
  };
}

/**
 * Agrupa dias seguidos num período, para os pedidos se lerem como
 * "13 a 17 de julho" em vez de cinco linhas soltas. Só junta dias com o mesmo
 * estado, e fins de semana pelo meio não quebram o período.
 */
export function groupRanges(days: LeaveDay[]): {
  from: string;
  to: string;
  days: LeaveDay[];
  status: LeaveStatus;
}[] {
  const ordenados = [...days].sort((a, b) => a.day.localeCompare(b.day));
  const grupos: { from: string; to: string; days: LeaveDay[]; status: LeaveStatus }[] = [];

  for (const d of ordenados) {
    const atual = grupos[grupos.length - 1];
    if (atual && atual.status === d.status && seguem(atual.to, d.day)) {
      atual.to = d.day;
      atual.days.push(d);
    } else {
      grupos.push({ from: d.day, to: d.day, days: [d], status: d.status });
    }
  }
  return grupos;
}

/** `b` é o próximo dia útil depois de `a`? (salta o fim de semana) */
function seguem(a: string, b: string): boolean {
  const [ay, am, ad] = a.split("-").map(Number);
  const cursor = new Date(ay!, am! - 1, ad!);
  for (let i = 0; i < 3; i++) {
    cursor.setDate(cursor.getDate() + 1);
    const iso = isoDay(cursor);
    if (iso === b) return true;
    if (!isWeekend(iso)) return false;
  }
  return false;
}

const meses = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** "13 a 17 de julho" ou "24 de dezembro". */
export function describeRange(from: string, to: string): string {
  const [, fm, fd] = from.split("-").map(Number);
  const [, tm, td] = to.split("-").map(Number);
  if (from === to) return `${fd} de ${meses[fm! - 1]}`;
  if (fm === tm) return `${fd} a ${td} de ${meses[fm! - 1]}`;
  return `${fd} de ${meses[fm! - 1]} a ${td} de ${meses[tm! - 1]}`;
}
