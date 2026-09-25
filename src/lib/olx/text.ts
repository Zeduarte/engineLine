/**
 * Regras de texto do OLX para título e descrição.
 *
 * O OLX recusa o anúncio inteiro se o texto falhar uma destas regras (400 com
 * "Data validation error"), e os erros chegam em inglês ou polaco. É mais
 * barato garanti-las aqui do que traduzir a recusa:
 *
 *  - título com 16 a 150 caracteres; descrição com 80 a 9000;
 *  - no máximo 50% de maiúsculas (contadas só entre as letras);
 *  - sem emails, endereços web nem telefones;
 *  - nenhum de `!?.,-=+#%&@*_><:()|` três vezes seguidas.
 *
 * Funções puras: entra texto, sai texto válido.
 */

export const TITLE_MIN = 16;
export const TITLE_MAX = 150;
export const DESCRIPTION_MIN = 80;
export const DESCRIPTION_MAX = 9000;

const EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g;
const URL = /\b(?:https?:\/\/|www\.)\S+/gi;
/** Sequências que parecem um telefone: 9 ou mais dígitos, com separadores. */
const PHONE = /\+?\d[\d\s.()-]{7,}\d/g;
const PUNCT = "!?.,-=+#%&@*_><:()|";

/** Remove contactos: o OLX não os aceita no texto (o contacto vai à parte). */
export function stripContacts(text: string): string {
  return text
    .replace(EMAIL, "")
    .replace(URL, "")
    .replace(PHONE, (m) => (m.replace(/\D/g, "").length >= 9 ? "" : m));
}

/** Nenhum sinal de pontuação mais de duas vezes seguidas ("!!!" → "!"). */
export function tamePunctuation(text: string): string {
  let out = "";
  for (const ch of text) {
    const tail = out.slice(-2);
    if (PUNCT.includes(ch) && tail === ch + ch) continue;
    out += ch;
  }
  // "!!" também é ruído num anúncio: fica um só.
  return out.replace(/([!?.,=+#%&@*_><:|-])\1+/g, "$1");
}

/** Fração de maiúsculas entre as letras (0 quando não há letras). */
export function capsRatio(text: string): number {
  const letters = [...text].filter((c) => c.toLowerCase() !== c.toUpperCase());
  if (!letters.length) return 0;
  return letters.filter((c) => c === c.toUpperCase()).length / letters.length;
}

/**
 * Baixa as maiúsculas até ficarem em 50% ou menos.
 *
 * Primeiro passam a minúsculas as palavras escritas TODAS em maiúsculas que não
 * sejam siglas curtas (BMW, GPL, ABS ficam); se não chegar, o texto inteiro
 * passa a "Frase normal".
 */
export function tameCaps(text: string): string {
  if (capsRatio(text) <= 0.5) return text;
  const softened = text.replace(/\p{L}{5,}/gu, (w) =>
    w === w.toUpperCase() ? w[0] + w.slice(1).toLowerCase() : w,
  );
  if (capsRatio(softened) <= 0.5) return softened;
  const lower = text.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function tidy(text: string): string {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Aplica todas as regras a um texto qualquer. */
export function cleanText(text: string): string {
  return tidy(tameCaps(tamePunctuation(stripContacts(text))));
}

/**
 * Título do anúncio.
 *
 * "BMW 320d 2018" tem 3 letras maiúsculas em 4 — mais de 50% — e só 13
 * caracteres. Por isso, se preciso, acrescentam-se pormenores em minúsculas
 * (combustível, quilómetros) até cumprir o mínimo e a regra das maiúsculas.
 */
export function buildTitle(base: string, extras: string[]): string {
  // As maiúsculas só se reduzem no fim: reduzidas logo à cabeça, "BMW" virava
  // "Bmw" antes de os pormenores em minúsculas resolverem a proporção.
  let title = tidy(tamePunctuation(stripContacts(base)));
  for (const extra of extras) {
    if (title.length >= TITLE_MIN && capsRatio(title) <= 0.5) break;
    const next = `${title} · ${extra.toLowerCase()}`;
    if (next.length > TITLE_MAX) break;
    title = next;
  }
  title = tameCaps(title);
  if (title.length < TITLE_MIN) title = `${title} · viatura usada`.slice(0, TITLE_MAX);
  return title.slice(0, TITLE_MAX).trim();
}

/**
 * Descrição do anúncio: o texto do stand, limpo, e a ficha técnica a seguir.
 * A ficha garante o mínimo de 80 caracteres mesmo quando o anúncio do site não
 * tem descrição.
 */
export function buildDescription(text: string, specs: string[]): string {
  const body = cleanText(text);
  const ficha = specs.filter(Boolean).map((s) => `• ${cleanText(s)}`).join("\n");
  let out = [body, ficha].filter(Boolean).join("\n\n");
  if (out.length < DESCRIPTION_MIN) {
    out = `${out}\n\nViatura verificada e pronta a entregar. Contacte-nos pelo OLX para mais informações ou para marcar uma visita.`.trim();
  }
  return tameCaps(out).slice(0, DESCRIPTION_MAX).trim();
}

/** Verifica um título/descrição contra as regras. Devolve os problemas. */
export function textProblems(title: string, description: string): string[] {
  const problems: string[] = [];
  if (title.length < TITLE_MIN || title.length > TITLE_MAX)
    problems.push(`o título tem de ter entre ${TITLE_MIN} e ${TITLE_MAX} caracteres`);
  if (description.length < DESCRIPTION_MIN || description.length > DESCRIPTION_MAX)
    problems.push(`a descrição tem de ter entre ${DESCRIPTION_MIN} e ${DESCRIPTION_MAX} caracteres`);
  for (const [nome, t] of [["título", title], ["descrição", description]] as const) {
    if (capsRatio(t) > 0.5) problems.push(`a ${nome} tem mais de 50% de maiúsculas`);
    if (stripContacts(t) !== t) problems.push(`a ${nome} contém um contacto`);
    if ([...PUNCT].some((p) => t.includes(p.repeat(3))))
      problems.push(`a ${nome} repete pontuação`);
  }
  return problems;
}
