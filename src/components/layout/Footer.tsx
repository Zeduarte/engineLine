import Link from "next/link";
import Image from "next/image";
import { site } from "@/lib/site";
import { DEFAULT_BRANDING, type Branding } from "@/lib/branding";

export function Footer({
  branding = DEFAULT_BRANDING,
}: {
  branding?: Branding;
}) {
  return (
    <footer className="border-t border-white/10 bg-ink">
      <div className="container-px grid gap-12 py-16 md:grid-cols-4 md:py-20">
        <div className="md:col-span-2">
          {branding.logoUrl ? (
            <Image
              src={branding.logoUrl}
              alt={branding.companyName}
              width={180}
              height={44}
              className="h-9 w-auto object-contain"
            />
          ) : (
            <p className="text-2xl font-bold tracking-tight text-paper">
              {branding.companyName}
            </p>
          )}
          <p className="mt-4 max-w-sm text-sm font-light text-paper/60">
            {branding.tagline || site.description}
          </p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-paper/40">
            Navegação
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link href="/inventario" className="text-paper/70 hover:text-paper">
                Stock
              </Link>
            </li>
            <li>
              <Link href="/sobre" className="text-paper/70 hover:text-paper">
                Sobre
              </Link>
            </li>
            <li>
              <Link href="/contactos" className="text-paper/70 hover:text-paper">
                Contactos
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-paper/40">
            Contactos
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-paper/70">
            <li>
              <a href={branding.company.phoneHref} className="hover:text-paper">
                {branding.company.phone}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${branding.company.email}`}
                className="hover:text-paper"
              >
                {branding.company.email}
              </a>
            </li>
            <li>
              {branding.company.address.street},{" "}
              {branding.company.address.postalCode}{" "}
              {branding.company.address.city}
            </li>
            <li className="text-paper/50">{branding.company.hours}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="container-px flex flex-col items-center justify-between gap-2 py-6 text-xs text-paper/40 md:flex-row">
          <p>
            © {new Date().getFullYear()} {branding.companyName}. Todos os
            direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <p>Feito em Portugal.</p>
            <Link
              href="/admin"
              className="text-paper/40 transition-colors hover:text-accent"
            >
              Área reservada
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
