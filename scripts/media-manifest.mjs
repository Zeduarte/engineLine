// Lista os ficheiros de public/media e escreve src/lib/media-manifest.json.
//
// O servidor consulta esta lista para saber que imagens/vídeos existem, em vez
// de ler o disco. Ler `public/` com um caminho variável fazia o Next copiar a
// pasta inteira para dentro da função do Netlify, que passou dos 250 MB.
//
// Corre sozinho antes de `npm run build` e `npm run dev`.
import { readdirSync, statSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = join(process.cwd(), "public");
const DIR = join(ROOT, "media");
const OUT = join(process.cwd(), "src", "lib", "media-manifest.json");

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (name.startsWith(".")) return [];
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : ["/" + relative(ROOT, full).split(sep).join("/")];
  });
}

export function buildManifest() {
  return existsSync(DIR) ? walk(DIR).filter((p) => !p.endsWith(".txt")).sort() : [];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const json = JSON.stringify(buildManifest(), null, 2) + "\n";
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (current !== json) writeFileSync(OUT, json);
  console.log(`media-manifest: ${JSON.parse(json).length} ficheiros`);
}
