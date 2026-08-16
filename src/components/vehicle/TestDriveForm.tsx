"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { submitLead, type LeadActionState } from "@/lib/actions/leads";

/**
 * Formulário de marcação de test drive.
 *
 * Persiste o pedido como `lead` no Supabase via Server Action (`submitLead`),
 * com validação Zod no servidor. Validação leve adicional no cliente e estado
 * de sucesso animado. Acessível: labels associadas, `aria-invalid`, mensagens
 * ligadas por `aria-describedby`.
 */
export function TestDriveForm({
  vehicleName,
  vehicleId,
  bare = false,
}: {
  vehicleName: string;
  vehicleId?: string;
  /** Quando true, não desenha o cartão/título próprios (usado no seletor). */
  bare?: boolean;
}) {
  const [state, formAction, pending] = useActionState<
    LeadActionState,
    FormData
  >(submitLead, { ok: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  function validate(e: React.FormEvent<HTMLFormElement>) {
    const data = Object.fromEntries(
      new FormData(e.currentTarget),
    ) as Record<string, string>;
    const next: Record<string, string> = {};
    if (!data.name?.trim()) next.name = "Indique o seu nome.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email ?? ""))
      next.email = "Email inválido.";
    if (!/^[\d\s+]{9,}$/.test(data.phone ?? ""))
      next.phone = "Telefone inválido.";
    if (!data.preferred_date) next.preferred_date = "Escolha uma data.";
    setErrors(next);
    if (Object.keys(next).length > 0) e.preventDefault();
  }

  const content = (
    <>
      <AnimatePresence mode="wait">
        {state.ok ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl border border-accent/30 bg-accent/10 p-6 text-center"
          >
            <p className="text-lg font-semibold text-paper">Pedido recebido</p>
            <p className="mt-1 text-sm text-paper/60">
              Entraremos em contacto para confirmar o seu test drive.
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            ref={formRef}
            action={formAction}
            onSubmit={validate}
            noValidate
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 grid gap-4"
          >
            <input type="hidden" name="kind" value="test_drive" />
            {vehicleId && <input type="hidden" name="car_id" value={vehicleId} />}
            <input type="hidden" name="car_label" value={vehicleName} />

            <FormField id="name" label="Nome" error={errors.name}>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
                className="input"
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="email" label="Email" error={errors.email}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className="input"
                />
              </FormField>
              <FormField id="phone" label="Telefone" error={errors.phone}>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                  className="input"
                />
              </FormField>
            </div>

            <FormField
              id="preferred_date"
              label="Data preferencial"
              error={errors.preferred_date}
            >
              <input
                id="preferred_date"
                name="preferred_date"
                type="date"
                aria-invalid={!!errors.preferred_date}
                aria-describedby={
                  errors.preferred_date ? "preferred_date-error" : undefined
                }
                className="input"
              />
            </FormField>

            <FormField id="message" label="Mensagem (opcional)">
              <textarea id="message" name="message" rows={3} className="input" />
            </FormField>

            {state.error && (
              <p className="text-sm text-red-400" role="alert">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-2 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-ink transition-transform duration-300 ease-premium hover:scale-[1.02] disabled:opacity-60"
            >
              {pending ? "A enviar…" : "Pedir test drive"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(255,255,255,0.1);
          background: #0A0A0A;
          padding: 0.65rem 0.85rem;
          font-size: 0.875rem;
          color: #F5F5F4;
          transition: border-color 0.2s;
        }
        .input:focus { outline: none; border-color: var(--accent); }
        .input::-webkit-calendar-picker-indicator { filter: invert(0.8); }
      `}</style>
    </>
  );

  if (bare) return content;

  return (
    <section
      aria-labelledby="testdrive-title"
      className="rounded-3xl border border-white/10 bg-ink-soft p-6 md:p-8"
    >
      <h2 id="testdrive-title" className="text-2xl font-semibold text-paper">
        Marcar test drive
      </h2>
      <p className="mt-2 text-sm text-paper/50">
        Experimente o {vehicleName} sem compromisso.
      </p>
      {content}
    </section>
  );
}

function FormField({
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
        <p id={`${id}-error`} className="mt-1 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
