# engineLine

Website de um stand de automóveis premium em Portugal, com animações ligadas ao
scroll ao estilo dos sites de produto da Apple.

## Stack

| Camada            | Tecnologia                                  |
| ----------------- | ------------------------------------------- |
| Framework         | Next.js 15 (App Router) + TypeScript estrito |
| Estilos           | Tailwind CSS                                |
| Scroll animations | GSAP + ScrollTrigger                        |
| Smooth scroll     | Lenis                                       |
| Micro-interações  | Framer Motion                               |
| Imagens           | `next/image`                                |
| Dados             | Mock tipado em `data/vehicles.ts`           |

## Arranque

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de produção (SSG)
npm run typecheck
npm run lint
```

## Estrutura

```
data/vehicles.ts            Mock tipado (troca-se por API REST sem tocar na UI)
src/
  app/                      Rotas (App Router)
    page.tsx                Home: hero + destaques + secção pinned + CTA
    inventario/             Grelha com filtros, ordenação e stagger
    viaturas/[slug]/        Ficha: SSG + metadata dinâmica + JSON-LD
    sobre/  contactos/      Institucionais (contactos com mapa)
    template.tsx            Transição de página (Framer Motion)
    sitemap.ts  robots.ts   SEO
  components/
    hero/                   Canvas 360º + placeholder procedural
    home/  inventory/  vehicle/  layout/  ui/  seo/  providers/
  hooks/                    useScrollAnimation, useImageSequence, …
  lib/                      gsap (registo), vehicles (acesso a dados), format, site
  types/vehicle.ts          Modelo de domínio (fonte da verdade)
```

## Decisões técnicas

### Fonte de dados desacoplada

Os componentes nunca importam o mock diretamente — passam por `src/lib/vehicles.ts`,
cujas funções são `async`. Migrar para uma API REST resume-se a trocar o corpo
dessas funções por `fetch`, sem tocar em páginas nem componentes.

### Um único loop de animação (Lenis × GSAP)

O `LenisProvider` desliga o RAF interno do Lenis e conduz o smooth scroll a
partir do ticker do GSAP, e liga `lenis.on("scroll", ScrollTrigger.update)`. Ter
duas fontes de tempo provoca *jitter*; com uma só, scrubs e pins ficam colados.

### Hero em vídeo "scrubbed" pelo scroll

O hero (`HeroVideo`) reproduz um vídeo cujo `currentTime` é conduzido pela
posição do scroll: descer avança o vídeo, subir recua-o. O GSAP faz o tween da
propriedade `currentTime` com `scrub`, e a secção tem 320vh de "pista" (o pin é
feito com `position: sticky`). O vídeo fica `muted`/`playsInline` para permitir
o seeking por JS. Há duas fontes (`hero.webm` VP9 + `hero.mp4` H.264) para
cobrir todos os browsers, com `poster` para o primeiro paint.

> O vídeo incluído (`public/hero/hero.*`) — um desportivo em andamento ao pôr
> do sol — foi **gerado proceduralmente** (animação em canvas → frames →
> ffmpeg, todos os frames keyframe para um scrub perfeito). Para o substituir
> por um clip real (ex.: um stock video com licença livre), troca os ficheiros
> em `public/hero/` mantendo os nomes, ou passa `sources` ao `<HeroVideo>`.
> Dica de scrubbing suave: re-encoda com keyframes densos, ex. `-g 1`.

### SplitText manual

`AnimatedText` parte o texto em unidades e anima-as com uma máscara
(`overflow: hidden` + `yPercent`), sem o plugin pago do GreenSock. O texto
completo mantém-se legível para leitores de ecrã via `aria-label`.

### Acessibilidade e `prefers-reduced-motion`

`usePrefersReducedMotion` é a fonte da verdade. Quando o utilizador pede menos
movimento: o Lenis não é instanciado, o `useScrollAnimation` não corre os
setups, o Framer Motion desliga transições e o CSS mostra sempre o estado final.
O conteúdo é visível mesmo sem JS (os estados "escondidos" só se aplicam sob a
classe `.js-anim`, adicionada apenas quando o movimento é permitido).

### SEO

Cada viatura é uma página estática (`generateStaticParams`) com metadata
dinâmica (Open Graph) e **JSON-LD `schema.org/Vehicle`** no HTML inicial.
`sitemap.ts` e `robots.ts` completam a indexação.

## Personalização rápida

- **Acento da marca:** `--accent` em `src/app/globals.css` (+ `site.accent`).
- **Contactos / morada / mapa:** `src/lib/site.ts`.
- **Frames do hero:** `public/hero/frames/` + `src/components/hero/frames.ts`.
