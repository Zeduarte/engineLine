"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createTask,
  setTaskDone,
  deleteTask,
} from "@/lib/actions/workshop";
import type { VehicleTaskRow } from "@/lib/supabase/database.types";

export function TaskManager({
  carId,
  initial,
}: {
  carId: string;
  initial: VehicleTaskRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const open = initial.filter((t) => !t.done);
  const done = initial.filter((t) => t.done);
  const totalHours = initial.reduce((s, t) => s + Number(t.hours || 0), 0);

  function add(formData: FormData) {
    startTransition(async () => {
      const res = await createTask(formData);
      if (res.ok) {
        toast.success("Tarefa registada.");
        formRef.current?.reset();
        router.refresh();
      } else {
        toast.error(res.error ?? "Erro ao registar.");
      }
    });
  }

  function toggle(id: string, done: boolean) {
    startTransition(async () => {
      const res = await setTaskDone(id, done);
      if (res.ok) router.refresh();
      else toast.error("Erro ao atualizar.");
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteTask(id);
      if (res.ok) {
        toast.success("Tarefa apagada.");
        router.refresh();
      } else {
        toast.error("Erro ao apagar.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Nova tarefa */}
      <form ref={formRef} action={add} className="card space-y-3 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-paper/50">
          Nova tarefa
        </h2>
        <input type="hidden" name="car_id" value={carId} />
        <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
          <div>
            <span className="field-label">Descrição</span>
            <input
              name="title"
              placeholder="Ex.: Mudança de óleo e filtros"
              className="field"
              required
            />
          </div>
          <div>
            <span className="field-label">Horas</span>
            <input
              name="hours"
              type="number"
              step="0.5"
              min="0"
              defaultValue="0"
              className="field"
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>
        </div>
        <div>
          <span className="field-label">Notas (opcional)</span>
          <textarea
            name="notes"
            rows={2}
            placeholder="Peças usadas, observações…"
            className="field"
          />
        </div>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "A guardar…" : "Registar tarefa"}
        </button>
      </form>

      {/* Resumo */}
      <div className="flex gap-3 text-sm">
        <span className="rounded-full bg-white/5 px-3 py-1 text-paper/70">
          {open.length} por fazer
        </span>
        <span className="rounded-full bg-white/5 px-3 py-1 text-paper/70">
          {done.length} concluídas
        </span>
        <span className="rounded-full bg-accent/15 px-3 py-1 font-medium text-accent">
          {totalHours.toLocaleString("pt-PT")} h no total
        </span>
      </div>

      {/* Listas */}
      {initial.length === 0 ? (
        <div className="card grid place-items-center p-12 text-center">
          <p className="text-3xl">📋</p>
          <p className="mt-2 text-sm text-paper/50">
            Ainda não há tarefas para esta viatura.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {[...open, ...done].map((t) => (
            <li
              key={t.id}
              className={`card flex items-start gap-3 p-4 ${t.done ? "opacity-60" : ""}`}
            >
              <button
                type="button"
                disabled={pending}
                onClick={() => toggle(t.id, !t.done)}
                aria-label={t.done ? "Marcar por fazer" : "Marcar concluída"}
                className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border text-xs ${
                  t.done
                    ? "border-accent bg-accent text-ink"
                    : "border-white/25 text-transparent hover:border-accent"
                }`}
              >
                ✓
              </button>
              <div className="min-w-0 flex-1">
                <p className={`font-medium text-paper ${t.done ? "line-through" : ""}`}>
                  {t.title}
                </p>
                {t.notes && (
                  <p className="mt-1 text-sm text-paper/60">{t.notes}</p>
                )}
                <p className="mt-1 text-xs text-paper/40">
                  {Number(t.hours) > 0 && `${Number(t.hours)} h · `}
                  {new Date(t.created_at).toLocaleDateString("pt-PT")}
                </p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => remove(t.id)}
                aria-label="Apagar tarefa"
                className="shrink-0 rounded-md px-2 py-1 text-xs text-paper/40 hover:bg-red-500/15 hover:text-red-300"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
