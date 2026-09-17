"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { waHref } from "@/lib/branding";
import { ContactFab } from "@/components/layout/ContactFab";
import { ChatWidget } from "./ChatWidget";

/**
 * Botão flutuante único do site: assistente virtual + canais de contacto
 * humanos. Substitui o `ContactFab` para não haver dois botões no mesmo canto
 * — quando o assistente não está configurado, delega nele tal como antes.
 */
export function ChatLauncher({
  whatsapp,
  messenger,
  name,
  chatEnabled,
}: {
  whatsapp: string;
  messenger: string;
  name: string;
  chatEnabled: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  if (!chatEnabled) {
    return <ContactFab whatsapp={whatsapp} messenger={messenger} name={name} />;
  }

  const channels = [
    whatsapp && {
      key: "wa",
      label: "WhatsApp",
      href: waHref(whatsapp, "Olá! Vi o vosso site e gostava de mais informações."),
      bg: "#25D366",
      icon: <WhatsAppIcon />,
    },
    messenger && {
      key: "m",
      label: "Messenger",
      href: messenger,
      bg: "#0A7CFF",
      icon: <MessengerIcon />,
    },
  ].filter(Boolean) as {
    key: string;
    label: string;
    href: string;
    bg: string;
    icon: React.ReactNode;
  }[];

  function openChat() {
    setMenuOpen(false);
    setChatOpen(true);
  }

  return (
    <>
      <ChatWidget
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        companyName={name}
      />

      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {menuOpen && !chatOpen && (
            <>
              <motion.button
                key="assistant"
                type="button"
                onClick={openChat}
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                className="flex items-center gap-3"
              >
                <span className="rounded-full bg-ink-soft/95 px-3 py-1.5 text-sm font-medium text-paper shadow-lg backdrop-blur">
                  Assistente virtual
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-ink shadow-lg shadow-black/30">
                  <SparkIcon />
                </span>
              </motion.button>

              {channels.map((c, i) => (
                <motion.a
                  key={c.key}
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Falar por ${c.label}`}
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.8 }}
                  transition={{ delay: (i + 1) * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <span className="rounded-full bg-ink-soft/95 px-3 py-1.5 text-sm font-medium text-paper shadow-lg backdrop-blur">
                    {c.label}
                  </span>
                  <span
                    style={{ background: c.bg }}
                    className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg shadow-black/30"
                  >
                    {c.icon}
                  </span>
                </motion.a>
              ))}
            </>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => {
            if (chatOpen) setChatOpen(false);
            else if (channels.length === 0) openChat();
            else setMenuOpen((o) => !o);
          }}
          aria-expanded={menuOpen || chatOpen}
          aria-label={
            chatOpen || menuOpen ? "Fechar" : `Falar com o ${name}`
          }
          className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-ink shadow-lg shadow-black/30 transition-transform hover:scale-110"
        >
          {chatOpen || menuOpen ? (
            <span className="text-3xl leading-none">×</span>
          ) : (
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z" />
      <path d="M18 15l.8 1.9 1.9.8-1.9.8L18 20.4l-.8-1.9-1.9-.8 1.9-.8L18 15z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
    </svg>
  );
}

function MessengerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
      <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.9 1.19 5.4 3.13 7.12.16.14.26.35.27.57l.05 1.78c.02.57.6.94 1.12.71l1.98-.87c.17-.08.36-.09.54-.04 1 .27 2.06.42 3.13.42 5.64 0 10-4.13 10-9.7S17.64 2 12 2m5.99 7.46-2.94 4.66c-.47.74-1.47.93-2.17.4l-2.34-1.75a.6.6 0 0 0-.72 0l-3.16 2.4c-.42.32-.97-.18-.69-.63l2.94-4.66c.47-.74 1.47-.93 2.17-.4l2.34 1.75c.21.16.51.16.72 0l3.16-2.4c.42-.32.97.18.69.63" />
    </svg>
  );
}
