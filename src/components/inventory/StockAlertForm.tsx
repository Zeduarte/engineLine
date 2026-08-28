"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { submitLead, type LeadActionState } from "@/lib/actions/leads";

/**
 * "Avise-me quando entrar" — capta o interesse de quem procura uma viatura que
 * ainda não está em stock. Persiste como lead (kind = "alert") para o staff
 * contactar assim que entrar algo compatível. Zero fricção: marca/modelo,
 * email e (opcional) telefone.
 */
export function StockAlertForm({ defaultQuery = "" }: { defaultQuery?: string }) {
  const [state, formAction, pending] = useActionState<LeadActionState, FormData>(
    submitLead,
    { ok: false },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  function validate(e: React.FormEvent<HTMLFormElement>) {
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<
      string,
      string
    >;
    const next: Record<string, string> = {};
    if (!data.name?.trim()) next.name = "Indique o seu nome.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email ?? ""))
      next.email = "Email inválido.";
    if (!data.message?.trim()) next.message = "Diga-nos o que procura.";
    setErrors(next);
    if (Object.keys(next).length > 0) e.preventDefault();
  }

  if (state.ok) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-accent/30 bg-accent/10 p-8 text-center"
      >
        <p className="text-4xl">🔔</p>
        <p className="mt-3 text-lg font-semibold text-paper">Alerta criado!</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-paper/60">
          Assim que entrar uma viatura compatível com o que procura, avisamos.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-ink-soft p-8 md:p-10">
      <p className="eyebrow mb-3">Não encontrou o que procura?</p>
      <h2 className="text-2xl font-semibold text-paper md:text-3xl">
        Avisamos quando entrar
      </h2>
      <p className="mt-2 max-w-md text-sm text-paper/60">
        Deixe o que procura e o seu contacto. Quando entrar algo compatível, é
        dos primeiros a saber — sem compromisso.
      </p>

      <form
        ref={formRef}
        action={formAction}
        onSubmit={validate}
        noValidate
        className="mt-6 grid gap-4 sm:grid-cols-2"
      >
        <input type="hidden" name="kind" value="alert" />

        <div className="sm:col-span-2">
          <label htmlFor="alert-message" className="sr-only">
            O que procura
          </label>
          <input
            id="alert-message"
            name="message"
            defaultValue={defaultQuery}
            placeholder="Ex.: BMW Série 3 diesel até 25.000 €"
            className="w-full rounded-xl border border-white/15 bg-ink px-4 py-3 text-sm text-paper placeholder:text-paper/40 focus:border-accent focus:outline-none"
          />
          {errors.message && (
            <p className="mt-1 text-xs text-rose-400">{errors.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="alert-name" className="sr-only">
            Nome
          </label>
          <input
            id="alert-name"
            name="name"
            placeholder="Nome"
            className="w-full rounded-xl border border-white/15 bg-ink px-4 py-3 text-sm text-paper placeholder:text-paper/40 focus:border-accent focus:outline-none"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-rose-400">{errors.name}</p>
          )}
        </div>

        <div>
          <label htmlFor="alert-email" className="sr-only">
            Email
          </label>
          <input
            id="alert-email"
            name="email"
            type="email"
            placeholder="Email"
            className="w-full rounded-xl border border-white/15 bg-ink px-4 py-3 text-sm text-paper placeholder:text-paper/40 focus:border-accent focus:outline-none"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-rose-400">{errors.email}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="alert-phone" className="sr-only">
            Telefone (opcional)
          </label>
          <input
            id="alert-phone"
            name="phone"
            placeholder="Telefone (opcional)"
            className="w-full rounded-xl border border-white/15 bg-ink px-4 py-3 text-sm text-paper placeholder:text-paper/40 focus:border-accent focus:outline-none"
          />
        </div>

        {state.error && (
          <p className="text-sm text-rose-400 sm:col-span-2">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.02] disabled:opacity-60 sm:col-span-2 sm:justify-self-start"
        >
          {pending ? "A criar alerta…" : "Criar alerta"}
        </button>
      </form>
    </div>
  );
}
