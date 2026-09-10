import "server-only";
import fs from "node:fs";
import path from "node:path";

/**
 * Média do hero, detetada pelo ficheiro colocado em `public/hero/`:
 *  - existe `hero.mp4`            → vídeo (controlado pelo scroll)
 *  - existe `hero.jpg|png|webp|avif` → imagem fixa
 *  - nada                        → fica o vídeo por defeito (mostra o poster)
 *
 * Assim o dono do site troca entre vídeo e imagem só substituindo o ficheiro,
 * sem mexer no código. A deteção corre no servidor (build/render).
 */
export type HeroMedia =
  | { type: "video"; poster: string }
  // `src2` (opcional): 2ª imagem que aparece por cima ao fazer scroll
  // (cross-fade). Útil p/ efeitos tipo "semáforo vermelho -> verde".
  | { type: "image"; src: string; src2?: string };

const HERO_DIR = path.join(process.cwd(), "public", "hero");
const IMAGE_NAMES = ["hero.jpg", "hero.jpeg", "hero.png", "hero.webp", "hero.avif"];
const IMAGE2_NAMES = [
  "hero-2.jpg",
  "hero-2.jpeg",
  "hero-2.png",
  "hero-2.webp",
  "hero-2.avif",
];

function firstExisting(names: string[]): string | null {
  for (const name of names) {
    if (fs.existsSync(path.join(HERO_DIR, name))) return `/hero/${name}`;
  }
  return null;
}

const VIDEO: HeroMedia = { type: "video", poster: "/hero/hero-poster.jpg" };

/** Devolve a imagem do hero (com 2ª imagem opcional p/ cross-fade), ou null. */
function imageMedia(): HeroMedia | null {
  const src = firstExisting(IMAGE_NAMES);
  if (!src) return null;
  const src2 = firstExisting(IMAGE2_NAMES);
  return src2 ? { type: "image", src, src2 } : { type: "image", src };
}

/**
 * Média do hero. `mode` vem da definição do backoffice (Página inicial):
 *  - "video" → força o vídeo (o poster aparece sempre que o mp4 falhe);
 *  - "image" → força a imagem (se não existir ficheiro, tenta /hero/hero.jpg);
 *  - "auto"  → deteta pelo ficheiro (mp4 primeiro, senão imagem, senão vídeo).
 */
export function getHeroMedia(
  mode: "auto" | "video" | "image" = "auto",
): HeroMedia {
  try {
    if (mode === "video") return VIDEO;

    if (mode === "image") {
      // Se existir imagem, usa-a; senão cai para o vídeo (nunca fica em branco).
      // A deteção corre no build, onde public/ está disponível — por isso uma
      // imagem commitada (public/hero/hero.jpg) é sempre encontrada.
      return imageMedia() ?? VIDEO;
    }

    // auto
    if (fs.existsSync(path.join(HERO_DIR, "hero.mp4"))) return VIDEO;
    const img = imageMedia();
    if (img) return img;
  } catch {
    // fs indisponível (ambiente sem acesso ao disco) — usa o vídeo por defeito.
  }
  return VIDEO;
}
