"use client";

import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { submitPublicTestimonial } from "@/lib/actions/testimonials";

/**
 * Botão + modal para qualquer visitante deixar um testemunho.
 * O testemunho é enviado para aprovação — só aparece no site depois de o staff
 * o aprovar no backoffice.
 */
export function LeaveTestimonial() {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");

  // Fecha com Escape e bloqueia o scroll do fundo enquanto o modal está aberto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await submitPublicTestimonial({ name, rating, role, body });
      if (res.ok) {
        setDone(true);
        setName("");
        setRole("");
        setRating(5);
        setBody("");
      } else {
        toast.error(res.error ?? "Não foi possível enviar.");
      }
    });
  }

  function close() {
    setOpen(false);
    // Repõe o estado depois da animação de saída.
    setTimeout(() => setDone(false), 300);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-paper transition-colors hover:border-accent hover:text-accent"
      >
        Deixar testemunho
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="leave-testimonial-title"
              className="w-full max-w-lg overflow-hidden rounded-t-3xl border border-white/10 bg-ink-soft p-6 sm:rounded-3xl md:p-8"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <h2
                  id="leave-testimonial-title"
                  className="text-xl font-semibold text-paper"
                >
                  Deixar o meu testemunho
                </h2>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Fechar"
                  className="text-2xl leading-none text-paper/50 hover:text-paper"
                >
                  ×
                </button>
              </div>

              {done ? (
                <div className="rounded-2xl border border-accent/30 bg-accent/10 p-6 text-center">
                  <p className="text-lg font-semibold text-paper">Obrigado!</p>
                  <p className="mt-1 text-sm text-paper/60">
                    O seu testemunho foi enviado e será publicado após aprovação.
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    className="mt-5 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-ink"
                  >
                    Fechar
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="grid gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-paper">
                      Nome
                    </label>
                    <input
                      className="field"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      maxLength={80}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-paper">
                      Contexto (opcional)
                    </label>
                    <input
                      className="field"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="Ex.: Comprei um BMW Série 3"
                      maxLength={80}
                    />
                  </div>

                  <div>
                    <span className="mb-1.5 block text-sm font-medium text-paper">
                      Classificação
                    </span>
                    <div className="flex gap-1" role="radiogroup" aria-label="Classificação">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          role="radio"
                          aria-checked={rating === n}
                          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                          onClick={() => setRating(n)}
                          className={`text-2xl transition-transform hover:scale-110 ${
                            n <= rating ? "text-accent" : "text-paper/25"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-paper">
                      O seu testemunho
                    </label>
                    <textarea
                      className="field"
                      rows={4}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      required
                      minLength={10}
                      maxLength={1000}
                      placeholder="Conte a sua experiência connosco…"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={pending}
                    className="mt-1 rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.02] disabled:opacity-60"
                  >
                    {pending ? "A enviar…" : "Enviar testemunho"}
                  </button>
                  <p className="text-center text-xs text-paper/40">
                    O testemunho é publicado após aprovação da nossa equipa.
                  </p>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
