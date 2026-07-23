import Link from "next/link";
import { AnimatedText } from "@/components/ui/AnimatedText";
import { Reveal } from "@/components/ui/Reveal";
import { site, whatsappHref } from "@/lib/site";

export function ContactCTA() {
  return (
    <section className="container-px py-24 md:py-40">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink-soft px-6 py-20 text-center md:px-16 md:py-32">
        <p className="eyebrow mb-6">Vamos falar</p>
        <AnimatedText
          as="h2"
          className="mx-auto max-w-3xl text-headline font-semibold text-paper"
        >
          A sua próxima viatura está a um contacto de distância
        </AnimatedText>

        <Reveal className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href={whatsappHref("Olá! Tenho interesse numa viatura do stand.")}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-ink transition-transform duration-300 ease-premium hover:scale-[1.03]"
          >
            Falar por WhatsApp
          </a>
          <Link
            href="/contactos"
            className="rounded-full border border-white/20 px-8 py-3.5 text-sm font-medium text-paper transition-colors duration-300 hover:border-white/60"
          >
            Ver contactos e mapa
          </Link>
        </Reveal>

        <p className="mt-8 text-sm text-paper/50">
          Ou ligue já:{" "}
          <a href={site.phoneHref} className="text-paper hover:text-accent">
            {site.phone}
          </a>
        </p>
      </div>
    </section>
  );
}
