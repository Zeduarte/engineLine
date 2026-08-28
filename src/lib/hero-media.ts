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
  | { type: "image"; src: string };

const HERO_DIR = path.join(process.cwd(), "public", "hero");
const IMAGE_NAMES = ["hero.jpg", "hero.jpeg", "hero.png", "hero.webp", "hero.avif"];

export function getHeroMedia(): HeroMedia {
  try {
    if (fs.existsSync(path.join(HERO_DIR, "hero.mp4"))) {
      return { type: "video", poster: "/hero/hero-poster.jpg" };
    }
    for (const name of IMAGE_NAMES) {
      if (fs.existsSync(path.join(HERO_DIR, name))) {
        return { type: "image", src: `/hero/${name}` };
      }
    }
  } catch {
    // fs indisponível (ambiente sem acesso ao disco) — usa o vídeo por defeito.
  }
  return { type: "video", poster: "/hero/hero-poster.jpg" };
}
