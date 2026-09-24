/**
 * Matrículas.
 *
 * Há duas formas no projecto e ambas são precisas:
 *  - a FORMATADA, com hífenes, que é o que o formulário de viaturas grava e o
 *    que se mostra a uma pessoa;
 *  - a CANÓNICA, só letras e dígitos, que é a única forma segura de comparar.
 *
 * A comparação tem de ser pela canónica porque as matrículas na base de dados
 * são inconsistentes: `create_workshop_intake_for_type` grava
 * `upper(trim(plate))` sem tirar hífenes, e o formulário grava-os. Duas
 * matrículas da mesma viatura podem estar gravadas de formas diferentes.
 */

/** Só letras e dígitos, em maiúsculas — a chave de comparação ("33-AD-22" → "33AD22"). */
export function plateKey(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * Formata a matrícula em grupos de 2 separados por hífen (ex.: "44vs23" →
 * "44-VS-23"). Aceita letras e dígitos, em maiúsculas.
 */
export function formatPlate(raw: string): string {
  const clean = plateKey(raw).slice(0, 6);
  return clean.match(/.{1,2}/g)?.join("-") ?? "";
}

/**
 * Parece uma matrícula portuguesa? Seis caracteres alfanuméricos. Serve para
 * decidir se um pedaço de texto solto é uma matrícula ou o nome de um modelo —
 * não para validar rigorosamente, que não é o nosso papel.
 */
export function isPlausiblePlate(raw: string): boolean {
  return /^[A-Z0-9]{6}$/.test(plateKey(raw));
}
