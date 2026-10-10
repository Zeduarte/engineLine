"use client";
import { useVehicleWorld } from "@/components/site/VehicleWorld";
import { WorldSwitch } from "@/components/site/WorldSwitch";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DEFAULT_BRANDING, type Branding } from "@/lib/branding";
import { useLocalList, FAVORITES_KEY } from "@/hooks/useLocalList";

/** Entrada em cascata de cada item do menu mobile. */
const MENU_ITEM = {
  open: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  closed: { opacity: 0, y: -8, transition: { duration: 0.15 } },
} as const;

const NAV = [
  { href: "/", label: "Início" },
  { href: "/inventario", label: "Stock" },
  { href: "/quiz", label: "Carro ideal" },
  { href: "/servicos", label: "Serviços" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contactos", label: "Contactos" },
];

export function Header({
  branding = DEFAULT_BRANDING,
}: {
  branding?: Branding;
}) {
  const pathname = usePathname();
  const world = useVehicleWorld();
  const router = useRouter();
  // Numa ficha de viatura (/viaturas/slug, não sub-rotas) mostramos a seta de
  // voltar ao lado do logótipo — sempre acessível no topo fixo.
  const onVehiclePage = /^\/viaturas\/[^/]+$/.test(pathname);
  const [scrolled, setScrolled] = useState(false);
  // Header "inteligente": esconde-se ao descer (mais espaço para o conteúdo) e
  // volta ao mínimo gesto de subida.
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const { items: favorites, ready: favReady } = useLocalList(FAVORITES_KEY);
  const favCount = favReady ? favorites.length : 0;

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      // Pequena zona morta para não tremer com micro-scrolls do trackpad.
      if (Math.abs(y - lastY) < 6) return;
      setHidden(y > lastY && y > 160);
      lastY = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fecha o menu mobile e volta a mostrar o header ao navegar.
  useEffect(() => {
    setOpen(false);
    setHidden(false);
  }, [pathname]);

  // Com o menu aberto nunca se esconde; o foco por teclado também o revela
  // (`onFocusCapture` no <header>).
  const visible = !hidden || open;

  return (
    <header
      onFocusCapture={() => setHidden(false)}
      className={`fixed inset-x-0 top-0 z-50 transition-[transform,background-color,border-color] duration-500 ease-premium ${
        visible ? "translate-y-0" : "-translate-y-full"
      } ${
        scrolled || open
          ? "border-b border-white/10 bg-ink/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="container-px flex h-16 items-center justify-between md:h-20">
        <div className="flex items-center gap-3">
          {onVehiclePage && (
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Voltar"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 text-xl leading-none text-paper transition-colors hover:border-white/50"
            >
              ‹
            </button>
          )}
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-paper"
            aria-label={`${branding.companyName} — página inicial`}
          >
            {branding.logoUrl ? (
              <Image
                src={branding.logoUrl}
                alt={branding.companyName}
                width={280}
                height={70}
                className="h-11 w-auto max-w-[55vw] object-contain md:h-14"
                priority
              />
            ) : (
              <span>{branding.companyName}</span>
            )}
          </Link>
        </div>

        <ul className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative text-sm font-medium transition-colors duration-300 ${
                    active ? "text-paper" : "text-paper/60 hover:text-paper"
                  }`}
                >
                  {item.label === "Carro ideal" && world === "motorcycle" ? "Mota ideal" : item.label}
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      transition={{ type: "spring", stiffness: 380, damping: 34 }}
                      className="absolute -bottom-1.5 left-0 h-px w-full bg-accent"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          {/* Passagem discreta para o outro mundo — só onde o tipo importa. */}
          <WorldSwitch world={world} />
          <Link
            href="/favoritos"
            aria-label={`Favoritos${favCount ? ` (${favCount})` : ""}`}
            className="relative grid h-10 w-10 place-items-center rounded-full border border-white/15 text-paper/70 transition-colors hover:border-rose-400/50 hover:text-rose-300"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill={favCount ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 20.5s-7.5-4.7-9.6-9C1.1 8.7 2.4 5.6 5.4 5c1.9-.4 3.7.5 4.6 2 .9-1.5 2.7-2.4 4.6-2 3 .6 4.3 3.7 3 6.5-2.1 4.3-9.6 9-9.6 9z"
              />
            </svg>
            {favCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {favCount}
              </span>
            )}
          </Link>
          <a
            href={branding.company.phoneHref}
            className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-paper transition-colors duration-300 hover:border-accent hover:text-accent"
          >
            {branding.company.phone}
          </a>
        </div>

        {/* Em mobile só há espaço para a versão curta, ao lado do menu. */}
        <div className="flex items-center gap-2 md:hidden">
          <WorldSwitch world={world} compact />

        {/* Botão mobile */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
        >
          <span className="relative block h-4 w-6">
            <span
              className={`absolute left-0 block h-0.5 w-6 bg-paper transition-all duration-300 ${
                open ? "top-1.5 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 top-1.5 block h-0.5 w-6 bg-paper transition-opacity duration-300 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 block h-0.5 w-6 bg-paper transition-all duration-300 ${
                open ? "top-1.5 -rotate-45" : "top-3"
              }`}
            />
          </span>
        </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden md:hidden"
          >
            <motion.ul
              className="container-px flex flex-col gap-1 py-4"
              initial="closed"
              animate="open"
              exit="closed"
              variants={{
                open: { transition: { staggerChildren: 0.04, delayChildren: 0.06 } },
                closed: { transition: { staggerChildren: 0.02, staggerDirection: -1 } },
              }}
            >
              {NAV.map((item) => (
                <motion.li key={item.href} variants={MENU_ITEM}>
                  <Link
                    href={item.href}
                    className="block rounded-lg px-2 py-3 text-lg font-medium text-paper/80 hover:text-paper"
                  >
                    {item.label === "Carro ideal" && world === "motorcycle" ? "Mota ideal" : item.label}
                  </Link>
                </motion.li>
              ))}
              <motion.li variants={MENU_ITEM}>
                <Link
                  href="/favoritos"
                  className="block rounded-lg px-2 py-3 text-lg font-medium text-paper/80 hover:text-paper"
                >
                  Favoritos{favCount > 0 ? ` (${favCount})` : ""}
                </Link>
              </motion.li>
              <motion.li variants={MENU_ITEM}>
                <a
                  href={branding.company.phoneHref}
                  className="mt-2 block rounded-full bg-accent px-5 py-3 text-center text-sm font-semibold text-ink transition-transform active:scale-[0.97]"
                >
                  Ligar · {branding.company.phone}
                </a>
              </motion.li>
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
