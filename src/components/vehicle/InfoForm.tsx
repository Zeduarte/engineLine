"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { submitLead, type LeadActionState } from "@/lib/actions/leads";

/**
 * Formulário "Pedir mais informações" sobre uma viatura. Persiste como lead
 * (kind = "contact"), associado à viatura.
 */
export function InfoForm({
  vehicleName,
  vehicleId,
}: {
  vehicleName: string;
  vehicleId?: string;
}) {
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
    if (!/^[\d\s+]{9,}$/.test(data.phone ?? ""))
      next.phone = "Telefone inválido.";
    if (!data.message?.trim()) next.message = "Escreva a sua questão.";
    setErrors(next);
    if (Object.keys(next).length > 0) e.preventDefault();
  }

  if (state.ok) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-accent/30 bg-accent/10 p-6 text-center"
      >
        <p className="text-lg font-semibold text-paper">Pedido enviado</p>
        <p className="mt-1 text-sm text-paper/60">
          Vamos responder às suas questões o mais rápido possível.
        </p>
      </motion.div>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={validate}
      noValidate
      className="grid gap-4"
    >
      <input type="hidden" name="kind" value="contact" />
      {vehicleId && <input type="hidden" name="car_id" value={vehicleId} />}
      <input type="hidden" name="car_label" value={vehicleName} />

      <Field id="name" label="Nome" error={errors.name}>
        <input id="name" name="name" type="text" autoComplete="name" className="field" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="email" label="Email" error={errors.email}>
          <input id="email" name="email" type="email" autoComplete="email" className="field" />
        </Field>
        <Field id="phone" label="Telefone" error={errors.phone}>
          <input id="phone" name="phone" type="tel" autoComplete="tel" className="field" />
        </Field>
      </div>

      <Field id="message" label="A sua questão" error={errors.message}>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="field"
          placeholder={`O que gostaria de saber sobre o ${vehicleName}?`}
        />
      </Field>

      {state.error && (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.02] disabled:opacity-60"
      >
        {pending ? "A enviar…" : "Enviar pedido"}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-paper">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
