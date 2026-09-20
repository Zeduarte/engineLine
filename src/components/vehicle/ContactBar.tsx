"use client";

import { useEffect, useState } from "react";
import type { Vehicle } from "@/types/vehicle";
import { priceLabel } from "@/lib/format";
import { waHref, type Company } from "@/lib/branding";
import { site } from "@/lib/site";
import { useChat } from "@/components/chat/ChatContext";
import { STARTERS_VEHICLE } from "@/components/chat/ChatWidget";

/**
 * Barra de ação fixa no fundo da ficha de viatura.
 *
 * Com o assistente ativo, é por aqui que se começa uma conversa: o visitante
 * escreve a pergunta sem ter de procurar um botão. Os contactos humanos
 * (WhatsApp e telefone) ficam ao lado, porque há sempre quem prefira falar
 * com alguém. Sem assistente, mantém-se a barra de sempre.
 */
export function ContactBar({
  vehicle,
  company,
}: {
  vehicle: Vehicle;
  company: Company;
}) {
  const { enabled, openChat } = useChat();
  const [question, setQuestion] = useState("");
  const [hint, setHint] = useState(0);

  // Roda as sugestões para convidar a perguntar — pára assim que escrevem.
  useEffect(() => {
    if (!enabled || question) return;
    const timer = setInterval(
      () => setHint((i) => (i + 1) % STARTERS_VEHICLE.length),
      5000,
    );
    return () => clearInterval(timer);
  }, [enabled, question]);

  const url = `${site.url}/viaturas/${vehicle.slug}`;
  const message = `Olá! Tenho interesse no ${vehicle.make} ${vehicle.model} ${vehicle.year} (${priceLabel(vehicle.price, vehicle.priceOnRequest)}).\n${url}`;

  return (
    <div className="sticky bottom-0 z-40 border-t border-white/10 bg-ink/90 backdrop-blur-xl">
      <div className="container-px flex items-center gap-3 py-3">
        {/* O preço só cabe em ecrãs largos; em mobile o espaço é do chat. */}
        <div className="hidden lg:block">
          <p className="text-xs text-paper/50">
            {vehicle.make} {vehicle.model}
          </p>
          <p className="text-lg font-semibold text-accent">
            {priceLabel(vehicle.price, vehicle.priceOnRequest)}
          </p>
        </div>

        {enabled ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const text = question.trim() || STARTERS_VEHICLE[hint]!;
              setQuestion("");
              openChat(text);
            }}
            // Em mobile ocupa a largura toda; em ecrãs largos um campo de
            // 1200px pareceria um formulário, não um convite a perguntar.
            className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-white/15 bg-white/5 pl-3 pr-1.5 focus-within:border-accent lg:max-w-xl"
          >
            <SparkIcon />
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={1000}
              placeholder={STARTERS_VEHICLE[hint]}
              aria-label="Perguntar ao assistente sobre esta viatura"
              className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-paper placeholder:text-paper/40 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Enviar pergunta"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-ink transition-transform hover:scale-105"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 19V5M6 11l6-6 6 6" />
              </svg>
            </button>
          </form>
        ) : (
          <a
            href={company.phoneHref}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-medium text-paper transition-colors hover:border-white/50"
          >
            Ligar
          </a>
        )}

        <div className="flex shrink-0 items-center gap-2">
          <a
            href={waHref(company.whatsapp, message)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Falar por WhatsApp sobre esta viatura"
            className="grid h-11 w-11 place-items-center rounded-full bg-[#25D366] text-white transition-transform hover:scale-105"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
            </svg>
          </a>
          <a
            href={company.phoneHref}
            aria-label={`Ligar ${company.phone}`}
            className="grid h-11 w-11 place-items-center rounded-full bg-accent text-ink transition-transform hover:scale-105"
          >
            <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden>
              <path d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.2.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 013 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1l-2.3 2.2z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-accent" aria-hidden>
      <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z" />
    </svg>
  );
}
