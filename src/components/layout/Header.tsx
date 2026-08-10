"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { site } from "@/lib/site";
import { DEFAULT_BRANDING, type Branding } from "@/lib/branding";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/inventario", label: "Inventário" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contactos", label: "Contactos" },
];

export function Header({
  branding = DEFAULT_BRANDING,
}: {
  branding?: Branding;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fecha o menu mobile ao navegar.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        scrolled || open
          ? "border-b border-white/10 bg-ink/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="container-px flex h-16 items-center justify-between md:h-20">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-paper"
          aria-label={`${branding.companyName} — página inicial`}
        >
          {branding.logoUrl ? (
            <Image
              src={branding.logoUrl}
              alt={branding.companyName}
              width={160}
              height={40}
              className="h-8 w-auto object-contain"
              priority
            />
          ) : (
            <span>{branding.companyName}</span>
          )}
        </Link>

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
                  {item.label}
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-1.5 left-0 h-px w-full bg-accent"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <a
          href={site.phoneHref}
          className="hidden rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-paper transition-colors duration-300 hover:border-accent hover:text-accent md:inline-block"
        >
          {site.phone}
        </a>

        {/* Botão mobile */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center md:hidden"
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
            <ul className="container-px flex flex-col gap-1 py-4">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-lg px-2 py-3 text-lg font-medium text-paper/80 hover:text-paper"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={site.phoneHref}
                  className="mt-2 block rounded-full bg-accent px-5 py-3 text-center text-sm font-semibold text-ink"
                >
                  Ligar · {site.phone}
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
