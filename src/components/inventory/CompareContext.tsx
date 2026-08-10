"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const MAX = 3;
const KEY = "engineline:compare";

interface CompareCtx {
  slugs: string[];
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
  remove: (slug: string) => void;
  clear: () => void;
  full: boolean;
}

const Ctx = createContext<CompareCtx | null>(null);

/** Estado global (persistido em localStorage) das viaturas a comparar. */
export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);

  // Hidrata do localStorage no cliente.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSlugs(JSON.parse(raw));
    } catch {
      /* ignora */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(slugs));
    } catch {
      /* ignora */
    }
  }, [slugs]);

  const value = useMemo<CompareCtx>(
    () => ({
      slugs,
      has: (slug) => slugs.includes(slug),
      toggle: (slug) =>
        setSlugs((prev) =>
          prev.includes(slug)
            ? prev.filter((s) => s !== slug)
            : prev.length >= MAX
              ? prev
              : [...prev, slug],
        ),
      remove: (slug) => setSlugs((prev) => prev.filter((s) => s !== slug)),
      clear: () => setSlugs([]),
      full: slugs.length >= MAX,
    }),
    [slugs],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCompare(): CompareCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCompare fora do CompareProvider");
  return ctx;
}

export const COMPARE_MAX = MAX;
