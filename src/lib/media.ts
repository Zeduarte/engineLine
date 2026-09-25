import type { VehicleType } from "@/lib/vehicle-categories";

/**
 * Fotografias e vídeos fixos do site, em `public/media/`:
 *  - `carros/` e `motas/` — o que muda com o mundo escolhido na entrada;
 *  - `comum/` — o que aparece igual nos dois.
 *
 * Para trocar uma imagem basta substituir o ficheiro mantendo o nome (ver
 * `public/media/LEIA-ME.txt`). O topo da página inicial não está aqui: é
 * detetado pelo ficheiro que existir (`topo.mp4` ou `topo.jpg`) — ver
 * `hero-media.ts`.
 */

const DIR: Record<VehicleType, string> = { car: "carros", motorcycle: "motas" };

/** Pasta de cada mundo, relativa a `public/`. */
export function mediaDir(type: VehicleType): string {
  return `/media/${DIR[type]}`;
}

export interface WorldMedia {
  /** Metade do ecrã de entrada (primeira visita). */
  entrada: string;
  /** Fundo do cartão "Retoma & Encomenda". */
  retoma: string;
  /** Faixa do questionário. */
  quiz: string;
}

export function mediaFor(type: VehicleType): WorldMedia {
  const dir = mediaDir(type);
  return {
    entrada: `${dir}/entrada.jpg`,
    retoma: `${dir}/retoma.jpg`,
    quiz: `${dir}/quiz.jpg`,
  };
}

export const COMMON_MEDIA = {
  rodape: "/media/comum/rodape.jpg",
  contacto: "/media/comum/contacto.jpg",
  sobre: "/media/comum/sobre.jpg",
  /** Ainda não existe: se faltar, a faixa fica com fundo escuro. */
  contactos: "/media/comum/contactos.jpg",
  confianca: "/media/comum/confianca.mp4",
  /** Ainda não existe: sem ele o vídeo mostra o primeiro fotograma. */
  confiancaPoster: "/media/comum/confianca.jpg",
} as const;
