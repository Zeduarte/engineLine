/**
 * Avatar do utilizador: iniciais sobre a cor de marca.
 *
 * Sem fotografia — não há onde a guardar nem quem a mantenha atualizada, e
 * duas iniciais identificam a pessoa igualmente bem num backoffice pequeno.
 */
export function Avatar({
  name,
  size = 36,
}: {
  name: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="grid shrink-0 place-items-center rounded-full bg-accent font-semibold text-ink"
    >
      {initials(name)}
    </span>
  );
}

/** "José Duarte Sousa" → "JS". Um nome só dá uma inicial. */
export function initials(name: string): string {
  const partes = name
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 1);
  if (partes.length === 0) return name.trim().slice(0, 1).toUpperCase() || "?";
  const primeira = partes[0]![0]!;
  const ultima = partes.length > 1 ? partes[partes.length - 1]![0]! : "";
  return (primeira + ultima).toUpperCase();
}
