"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Formulário de marcação de test drive.
 *
 * Validação leve no cliente (campos obrigatórios, formato de email/telefone) e
 * estado de sucesso animado. O `onSubmit` está preparado para `POST` a uma API
 * (`/api/test-drive`) — hoje simula a submissão. Acessível: labels associadas,
 * `aria-invalid`, mensagens de erro ligadas por `aria-describedby`.
 */
export function TestDriveForm({ vehicleName }: { vehicleName: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;

    const nextErrors: Record<string, string> = {};
    if (!data.name?.trim()) nextErrors.name = "Indique o seu nome.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email ?? ""))
      nextErrors.email = "Email inválido.";
    if (!/^[\d\s+]{9,}$/.test(data.phone ?? ""))
      nextErrors.phone = "Telefone inválido.";
    if (!data.date) nextErrors.date = "Escolha uma data.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("sending");
    // TODO(api): await fetch("/api/test-drive", { method: "POST", body: ... })
    await new Promise((r) => setTimeout(r, 900));
    setStatus("sent");
    form.reset();
  }

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

      <AnimatePresence mode="wait">
        {status === "sent" ? (
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
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="mt-4 text-sm font-medium text-accent hover:underline"
            >
              Marcar outro
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            noValidate
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 grid gap-4"
          >
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

            <FormField id="date" label="Data preferencial" error={errors.date}>
              <input
                id="date"
                name="date"
                type="date"
                aria-invalid={!!errors.date}
                aria-describedby={errors.date ? "date-error" : undefined}
                className="input"
              />
            </FormField>

            <FormField id="message" label="Mensagem (opcional)">
              <textarea id="message" name="message" rows={3} className="input" />
            </FormField>

            <button
              type="submit"
              disabled={status === "sending"}
              className="mt-2 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-ink transition-transform duration-300 ease-premium hover:scale-[1.02] disabled:opacity-60"
            >
              {status === "sending" ? "A enviar…" : "Pedir test drive"}
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
