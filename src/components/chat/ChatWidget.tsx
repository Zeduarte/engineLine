"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { ChatAction } from "@/lib/chat/actions";

/**
 * Painel do assistente virtual.
 *
 * Só fala com `/api/chat` — não conhece a chave da API nem os dados do stand.
 * As respostas chegam em NDJSON e são escritas à medida que chegam.
 */

interface Message {
  role: "user" | "assistant";
  content: string;
  actions?: ChatAction[];
}

/** Teto por conversa: protege a fatura mesmo que alguém insista. */
const MAX_USER_MESSAGES = 20;

/** Perguntas sugeridas — o assistente só existe na ficha de viatura. */
export const STARTERS_VEHICLE = [
  "Esta viatura tem garantia?",
  "É nacional? Quantos donos teve?",
  "Posso marcar um test drive?",
];

export function ChatWidget({
  open,
  onClose,
  companyName,
  initialQuestion,
  onQuestionSent,
}: {
  open: boolean;
  onClose: () => void;
  companyName: string;
  /** Pergunta escrita fora do painel (barra fixa da ficha). */
  initialQuestion?: string | null;
  onQuestionSent?: () => void;
}) {
  const pathname = usePathname();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Evita enviar duas vezes (o React em modo estrito corre o efeito a dobrar).
  const sentRef = useRef<string | null>(null);

  const userCount = messages.filter((m) => m.role === "user").length;
  const limitReached = userCount >= MAX_USER_MESSAGES;

  // Mantém a vista no fim à medida que a resposta é escrita.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Pergunta escrita na barra fixa: envia-a assim que o painel abre.
  useEffect(() => {
    if (!open || !initialQuestion || busy) return;
    if (sentRef.current === initialQuestion) return;
    sentRef.current = initialQuestion;
    onQuestionSent?.();
    void ask(initialQuestion);
    // `ask` é estável o suficiente para este disparo único por pergunta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialQuestion]);

  // Escape fecha o painel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function ask(question: string) {
    const text = question.trim();
    if (!text || busy || limitReached) return;

    const history = [...messages, { role: "user" as const, content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    setError(null);

    // O assistente só precisa do texto — nunca enviamos os botões de volta.
    const payload = history.map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload, pathname }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.error ?? "Não foi possível falar com o assistente.",
        );
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.trim()) applyEvent(line, setMessages, setError);
        }
      }
      if (buffer.trim()) applyEvent(buffer, setMessages, setError);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocorreu um erro.");
      // Remove a bolha vazia — não deixa uma resposta em branco no ecrã.
      setMessages((prev) =>
        prev.filter((m, i) => !(i === prev.length - 1 && !m.content)),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          role="dialog"
          aria-label={`Assistente virtual do ${companyName}`}
          className="fixed inset-x-3 bottom-24 z-50 flex max-h-[min(70vh,560px)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-ink-soft shadow-2xl shadow-black/50 sm:inset-x-auto sm:right-5 sm:w-[380px]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-paper">
                Assistente {companyName}
              </p>
              <p className="text-xs text-paper/50">
                Respostas automáticas sobre o stock
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar o assistente"
              className="grid h-8 w-8 place-items-center rounded-full text-xl leading-none text-paper/60 transition-colors hover:bg-white/10 hover:text-paper"
            >
              ×
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-paper/60">
                  Olá! Posso ajudar com dúvidas sobre as viaturas, horários e
                  como avançar. Não recolho dados pessoais — para isso uso os
                  formulários do site.
                </p>
                <div className="flex flex-col gap-2">
                  {STARTERS_VEHICLE.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => ask(s)}
                      className="rounded-2xl border border-white/10 px-3 py-2 text-left text-sm text-paper/80 transition-colors hover:border-accent hover:text-accent"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <Bubble key={i} message={m} busy={busy && i === messages.length - 1} />
            ))}

            {error && (
              <p role="alert" className="text-sm text-red-300">
                {error}
              </p>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex items-center gap-2 border-t border-white/10 px-4 py-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={1000}
              disabled={busy || limitReached}
              placeholder={
                limitReached ? "Conversa terminada" : "Escreva a sua pergunta…"
              }
              aria-label="Mensagem para o assistente"
              className="min-w-0 flex-1 rounded-full bg-white/5 px-4 py-2.5 text-sm text-paper placeholder:text-paper/35 focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={busy || limitReached || !input.trim()}
              aria-label="Enviar"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-ink transition-opacity disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </form>

          {limitReached && (
            <p className="px-5 pb-3 text-xs text-paper/50">
              Para continuar, fale com a equipa através dos contactos do site.
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Bubble({ message, busy }: { message: Message; busy: boolean }) {
  if (message.role === "user") {
    return (
      <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-accent px-3.5 py-2 text-sm text-ink">
        {message.content}
      </p>
    );
  }

  return (
    <div className="max-w-[90%] space-y-3">
      <p className="whitespace-pre-wrap rounded-2xl rounded-bl-md bg-white/5 px-3.5 py-2 text-sm leading-relaxed text-paper/90">
        {message.content}
        {busy && !message.content && (
          <span className="inline-flex gap-1 align-middle" aria-label="A escrever">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-paper/40"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
        )}
      </p>
      {message.actions?.map((a) => <ActionButton key={a.label} action={a} />)}
    </div>
  );
}

function ActionButton({ action }: { action: ChatAction }) {
  const className =
    "block rounded-full bg-accent/15 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/25";

  // Já estamos na página certa — rola até ao painel em vez de navegar.
  if (action.scrollTo) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => {
          const targets = document.querySelectorAll<HTMLElement>(
            `[data-chat-target="${action.scrollTo}"]`,
          );
          // A ficha rende o painel duas vezes (mobile e desktop); só um está visível.
          const visible = Array.from(targets).find((el) => el.offsetParent !== null);
          visible?.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
      >
        {action.label}
      </button>
    );
  }

  if (action.href.startsWith("/")) {
    return (
      <Link href={action.href} className={className}>
        {action.label}
      </Link>
    );
  }

  return (
    <a
      href={action.href}
      target={action.href.startsWith("http") ? "_blank" : undefined}
      rel="noopener noreferrer"
      className={className}
    >
      {action.label}
    </a>
  );
}

/** Aplica um evento NDJSON à última bolha do assistente. */
function applyEvent(
  line: string,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setError: (value: string | null) => void,
) {
  let event: { type?: string; value?: unknown };
  try {
    event = JSON.parse(line);
  } catch {
    return; // linha truncada — ignora-se em vez de partir a conversa
  }

  if (event.type === "text" && typeof event.value === "string") {
    const chunk = event.value;
    setMessages((prev) =>
      prev.map((m, i) =>
        i === prev.length - 1 ? { ...m, content: m.content + chunk } : m,
      ),
    );
  } else if (event.type === "actions" && Array.isArray(event.value)) {
    const actions = event.value as ChatAction[];
    setMessages((prev) =>
      prev.map((m, i) => (i === prev.length - 1 ? { ...m, actions } : m)),
    );
  } else if (event.type === "error" && typeof event.value === "string") {
    setError(event.value);
  }
}
