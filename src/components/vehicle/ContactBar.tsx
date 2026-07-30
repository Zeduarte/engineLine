import type { Vehicle } from "@/types/vehicle";
import { priceLabel } from "@/lib/format";
import { site, whatsappHref } from "@/lib/site";

/**
 * Barra de ação fixa no fundo (mobile-first). Mantém os CTAs de contacto —
 * WhatsApp e telefone — sempre acessíveis enquanto o utilizador lê a ficha.
 */
export function ContactBar({ vehicle }: { vehicle: Vehicle }) {
  const message = `Olá! Tenho interesse no ${vehicle.make} ${vehicle.model} ${vehicle.year} (${priceLabel(vehicle.price, vehicle.priceOnRequest)}).`;

  return (
    <div className="sticky bottom-0 z-40 border-t border-white/10 bg-ink/90 backdrop-blur-xl">
      <div className="container-px flex items-center justify-between gap-4 py-3">
        <div className="hidden sm:block">
          <p className="text-xs text-paper/50">
            {vehicle.make} {vehicle.model}
          </p>
          <p className="text-lg font-semibold text-accent">
            {priceLabel(vehicle.price, vehicle.priceOnRequest)}
          </p>
        </div>
        <div className="flex flex-1 gap-3 sm:flex-none">
          <a
            href={site.phoneHref}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-medium text-paper transition-colors hover:border-white/50 sm:flex-none"
          >
            Ligar
          </a>
          <a
            href={whatsappHref(message)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-ink transition-transform hover:scale-[1.02] sm:flex-none"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
