import Link from "next/link";
import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink">
      <div className="container-px grid gap-12 py-16 md:grid-cols-4 md:py-20">
        <div className="md:col-span-2">
          <p className="text-2xl font-bold tracking-tight text-paper">
            engine<span className="text-accent">Line</span>
          </p>
          <p className="mt-4 max-w-sm text-sm font-light text-paper/60">
            {site.description}
          </p>
        </div>

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-paper/40">
            Navegação
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link href="/inventario" className="text-paper/70 hover:text-paper">
                Inventário
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
              <a href={site.phoneHref} className="hover:text-paper">
                {site.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="hover:text-paper">
                {site.email}
              </a>
            </li>
            <li>
              {site.address.street}, {site.address.postalCode}{" "}
              {site.address.city}
            </li>
            <li className="text-paper/50">{site.hours}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="container-px flex flex-col items-center justify-between gap-2 py-6 text-xs text-paper/40 md:flex-row">
          <p>
            © {new Date().getFullYear()} {site.legalName}. Todos os direitos
            reservados.
          </p>
          <p>Feito em Portugal.</p>
        </div>
      </div>
    </footer>
  );
}
