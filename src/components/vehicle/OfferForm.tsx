"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { submitLead, type LeadActionState } from "@/lib/actions/leads";

/**
 * Formulário "Fazer uma proposta" — o visitante propõe um valor para a viatura.
 * Persiste como lead (kind = "offer"); o valor proposto vai na mensagem e nos
 * detalhes estruturados (car_details.offer_amount).
 */
export function OfferForm({
  vehicleName,
  vehicleId,
  price,
}: {
  vehicleName: string;
  vehicleId?: string;
  price?: number | null;
}) {
  const [state, formAction, pending] = useActionState<LeadActionState, FormData>(
    submitLead,
    { ok: false },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [amount, setAmount] = useState<string>(price ? String(price) : "");
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
    if (!amount || Number(amount) <= 0) next.amount = "Indique o valor proposto.";
    setErrors(next);
    if (Object.keys(next).length > 0) e.preventDefault();
  }

  const offerMessage = `Proposta de ${amount || "—"} € para o ${vehicleName}.`;
  const details = JSON.stringify({ offer_amount: Number(amount) || 0 });

  if (state.ok) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-accent/30 bg-accent/10 p-6 text-center"
      >
        <p className="text-lg font-semibold text-paper">Proposta enviada</p>
        <p className="mt-1 text-sm text-paper/60">
          Recebemos a sua proposta e entraremos em contacto em breve.
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
      <input type="hidden" name="kind" value="offer" />
      {vehicleId && <input type="hidden" name="car_id" value={vehicleId} />}
      <input type="hidden" name="car_label" value={vehicleName} />
      <input type="hidden" name="message" value={offerMessage} />
      <input type="hidden" name="details" value={details} />

      <Field id="amount" label="Valor proposto (€)" error={errors.amount}>
        <input
          id="amount"
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          className="field"
          placeholder="Ex.: 12500"
        />
      </Field>

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
        {pending ? "A enviar…" : "Enviar proposta"}
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
