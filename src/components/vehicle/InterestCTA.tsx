import type { Vehicle } from "@/types/vehicle";
import { priceLabel } from "@/lib/format";
import { waHref, type Company } from "@/lib/branding";
import { site } from "@/lib/site";

/**
 * Bloco "Interessado?" — chamada à ação no meio da ficha (entre a descrição e
 * a ficha técnica), com WhatsApp e telefone. Reforça o contacto sem o
 * utilizador ter de chegar ao fim da página.
 */
export function InterestCTA({
  vehicle,
  company,
}: {
  vehicle: Vehicle;
  company: Company;
}) {
  const url = `${site.url}/viaturas/${vehicle.slug}`;
  const message = `Olá! Tenho interesse no ${vehicle.make} ${vehicle.model} ${vehicle.year} (${priceLabel(vehicle.price, vehicle.priceOnRequest)}).\n${url}`;

  return (
    <section
      aria-labelledby="interessado"
      className="overflow-hidden rounded-3xl border border-accent/25 bg-gradient-to-br from-accent/15 via-ink-soft to-ink-soft p-6 md:p-8"
    >
      <h2 id="interessado" className="text-2xl font-semibold text-paper">
        Interessado?
      </h2>
      <p className="mt-2 max-w-xl text-[15px] font-light leading-relaxed text-paper/70">
        Fale connosco sobre este {vehicle.make} {vehicle.model}. Respondemos
        rápido e ajudamos com retoma, financiamento e marcação de visita.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <a
          href={waHref(company.whatsapp, message)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-semibold text-ink transition-transform hover:scale-[1.02]"
        >
          Falar por WhatsApp
        </a>
        {company.phone && (
          <a
            href={company.phoneHref}
            className="flex items-center justify-center gap-2 rounded-full border border-white/20 px-7 py-3 text-sm font-medium text-paper transition-colors hover:border-white/50"
          >
            Ligar {company.phone}
          </a>
        )}
      </div>
    </section>
  );
}
