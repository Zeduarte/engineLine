"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createTestimonial,
  deleteTestimonial,
  setTestimonialPublished,
} from "@/lib/actions/testimonials";

export interface TestimonialItem {
  id: string;
  name: string;
  rating: number;
  body: string;
  role: string | null;
  published: boolean;
  created_at: string;
}

export function TestimonialsManager({ items }: { items: TestimonialItem[] }) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");

  function add(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createTestimonial({ name, role, rating, body });
      if (res.ok) {
        toast.success("Testemunho adicionado.");
        setName("");
        setRole("");
        setRating(5);
        setBody("");
      } else toast.error(res.error ?? "Erro.");
    });
  }

  function togglePub(id: string, published: boolean) {
    startTransition(async () => {
      const res = await setTestimonialPublished(id, published);
      if (!res.ok) toast.error(res.error ?? "Erro.");
    });
  }

  function remove(id: string) {
    if (!confirm("Apagar este testemunho?")) return;
    startTransition(async () => {
      const res = await deleteTestimonial(id);
      if (res.ok) toast.success("Apagado.");
      else toast.error(res.error ?? "Erro.");
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="card space-y-4 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-paper/50">
          Novo testemunho
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <span className="field-label">Nome</span>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <span className="field-label">Contexto (opcional)</span>
            <input
              className="field"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Ex.: Comprou um BMW M4"
            />
          </div>
          <div>
            <span className="field-label">Classificação</span>
            <select
              className="field"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {"★".repeat(r)} ({r})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <span className="field-label">Testemunho</span>
          <textarea
            className="field"
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "A guardar…" : "Adicionar"}
        </button>
      </form>

      {items.length === 0 ? (
        <div className="card p-12 text-center text-sm text-paper/50">
          Ainda não há testemunhos.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((t) => (
            <li key={t.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-paper">
                    {t.name}{" "}
                    <span className="text-accent">{"★".repeat(t.rating)}</span>
                  </p>
                  {t.role && <p className="text-xs text-paper/50">{t.role}</p>}
                  <p className="mt-2 max-w-2xl text-sm text-paper/70">{t.body}</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-paper/60">
                    <input
                      type="checkbox"
                      checked={t.published}
                      disabled={pending}
                      onChange={(e) => togglePub(t.id, e.target.checked)}
                      className="accent-[color:var(--accent)]"
                    />
                    Publicado
                  </label>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => remove(t.id)}
                    className="rounded-lg px-2 py-1.5 text-xs text-red-400/70 hover:bg-red-500/10 hover:text-red-300"
                  >
                    🗑
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
