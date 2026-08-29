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

export function getHeroMedia(): HeroMedia {
  try {
    if (fs.existsSync(path.join(HERO_DIR, "hero.mp4"))) {
      return { type: "video", poster: "/hero/hero-poster.jpg" };
    }
    const src = firstExisting(IMAGE_NAMES);
    if (src) {
      const src2 = firstExisting(IMAGE2_NAMES);
      return src2 ? { type: "image", src, src2 } : { type: "image", src };
    }
  } catch {
    // fs indisponível (ambiente sem acesso ao disco) — usa o vídeo por defeito.
  }
  return { type: "video", poster: "/hero/hero-poster.jpg" };
}
