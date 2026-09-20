"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

/**
 * Estado do assistente, partilhado pelo site público.
 *
 * O painel de conversa vive no layout, mas quem o abre pode estar noutro
 * sítio — por exemplo a barra fixa da ficha de viatura, que já conhece a
 * viatura. Este contexto liga os dois sem duplicar o chat.
 */

interface ChatState {
  /** Há chave da API configurada? Sem ela o chat não existe. */
  enabled: boolean;
  open: boolean;
  /** Pergunta a enviar assim que o painel abrir (vinda da barra fixa). */
  question: string | null;
  openChat: (question?: string) => void;
  closeChat: () => void;
  /** O painel confirma que já enviou a pergunta inicial. */
  clearQuestion: () => void;
}

const Ctx = createContext<ChatState>({
  enabled: false,
  open: false,
  question: null,
  openChat: () => {},
  closeChat: () => {},
  clearQuestion: () => {},
});

export function ChatProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState<string | null>(null);

  const openChat = useCallback(
    (q?: string) => {
      if (!enabled) return;
      if (q?.trim()) setQuestion(q.trim());
      setOpen(true);
    },
    [enabled],
  );

  const value = useMemo<ChatState>(
    () => ({
      enabled,
      open,
      question,
      openChat,
      closeChat: () => setOpen(false),
      clearQuestion: () => setQuestion(null),
    }),
    [enabled, open, question, openChat],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useChat() {
  return useContext(Ctx);
}
