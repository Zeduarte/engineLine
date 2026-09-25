import "server-only";
import fs from "node:fs";
import path from "node:path";
import { mediaDir } from "@/lib/media";
import type { VehicleType } from "@/lib/vehicle-categories";

/**
 * Média do topo da página inicial, detetada pelo ficheiro que existir na pasta
 * do mundo (`public/media/carros/` ou `public/media/motas/`):
 *  - existe `topo.mp4`                  → vídeo (controlado pelo scroll)
 *  - existe `topo.jpg|png|webp|avif`    → imagem fixa
 *  - nada                               → vídeo, que mostra o `topo-poster.jpg`
 *
 * Assim o dono do site troca entre vídeo e imagem só substituindo o ficheiro,
 * sem mexer no código. A deteção corre no servidor (build/render).
 */
export type HeroMedia =
  | { type: "video"; src: string; poster: string }
  // `src2` (opcional): 2ª imagem que aparece por cima ao fazer scroll
  // (cross-fade). Útil p/ efeitos tipo "semáforo vermelho -> verde".
  | { type: "image"; src: string; src2?: string };

/**
 * Caminho público de um ficheiro opcional do mundo (`OPTIONAL_MEDIA`), ou null
 * se não existir — para o site não pedir ficheiros que não estão lá.
 */
export function existingMedia(type: VehicleType, file: string): string | null {
  const rel = `${mediaDir(type)}/${file}`;
  try {
    return fs.existsSync(path.join(process.cwd(), "public", rel)) ? rel : null;
  } catch {
    return null;
  }
}

const EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"];

function firstExisting(dir: string, base: string): string | null {
  for (const ext of EXTENSIONS) {
    const name = `${base}.${ext}`;
    if (fs.existsSync(path.join(process.cwd(), "public", dir, name))) return `${dir}/${name}`;
  }
  return null;
}

function video(dir: string): HeroMedia {
  return { type: "video", src: `${dir}/topo.mp4`, poster: `${dir}/topo-poster.jpg` };
}

/** Imagem do topo (com 2ª imagem opcional p/ cross-fade), ou null. */
function imageMedia(dir: string): HeroMedia | null {
  const src = firstExisting(dir, "topo");
  if (!src) return null;
  const src2 = firstExisting(dir, "topo-2");
  return src2 ? { type: "image", src, src2 } : { type: "image", src };
}

/**
 * Média do topo. `mode` vem da definição do backoffice (Página inicial):
 *  - "video" → força o vídeo (o poster aparece sempre que o mp4 falhe);
 *  - "image" → força a imagem (se não existir ficheiro, cai para o vídeo);
 *  - "auto"  → deteta pelo ficheiro (mp4 primeiro, senão imagem, senão vídeo).
 */
export function getHeroMedia(
  mode: "auto" | "video" | "image" = "auto",
  type: VehicleType = "car",
): HeroMedia {
  const dir = mediaDir(type);
  try {
    if (mode === "video") return video(dir);

    if (mode === "image") {
      // A deteção corre no build, onde public/ está disponível — por isso uma
      // imagem commitada é sempre encontrada.
      return imageMedia(dir) ?? video(dir);
    }

    // auto
    if (fs.existsSync(path.join(process.cwd(), "public", dir, "topo.mp4"))) return video(dir);
    const img = imageMedia(dir);
    if (img) return img;
  } catch {
    // fs indisponível (ambiente sem acesso ao disco) — usa o vídeo por defeito.
  }
  return video(dir);
}
