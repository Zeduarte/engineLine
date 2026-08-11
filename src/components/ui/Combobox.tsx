"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

/** Remove acentos e baixa a caixa para comparar "Citroën" com "citroen". */
function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Combobox de autocomplete com texto livre.
 *  - Ao escrever, filtra as opções que *contêm* o texto (sem acentos/caixa).
 *  - Com o campo vazio e focado, mostra a lista completa.
 *  - Aceita valores fora da lista (o utilizador pode escrever o que quiser).
 *  - Navegação por teclado: ↑/↓ para percorrer, Enter escolhe, Esc fecha.
 */
export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  id,
  className = "field",
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder?: string;
  id?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const filtered = useMemo(() => {
    const q = normalize(value);
    if (!q) return [...options];
    return options.filter((o) => normalize(o).includes(q));
  }, [value, options]);

  // Fechar ao clicar fora.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Mantém o item activo dentro dos limites da lista filtrada.
  useEffect(() => {
    setActive(0);
  }, [value]);

  function choose(option: string) {
    onChange(option);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) return setOpen(true);
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      if (open && filtered[active]) {
        e.preventDefault();
        choose(filtered[active]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {open && filtered.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-white/10 bg-ink-soft py-1 shadow-xl shadow-black/40"
        >
          {filtered.map((option, i) => (
            <li
              key={option}
              role="option"
              aria-selected={option === value}
              onMouseDown={(e) => {
                // onMouseDown corre antes do blur do input.
                e.preventDefault();
                choose(option);
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3.5 py-2 text-sm text-paper ${
                i === active ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
