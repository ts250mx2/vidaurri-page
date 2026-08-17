// Baja UNA VEZ las imágenes del carrusel del sitio actual de Vidaurri
// (apvidaurri.com/img/slideN.jpg) a public/vitrina/. Son fotos del propio
// cliente: quedan servidas desde este sitio, nunca enlazadas en caliente al
// servidor viejo, que además va a apagarse cuando esto reemplace la página.
//   node scripts/descargar-slides.mjs

import { mkdirSync, writeFileSync, existsSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destino = resolve(raiz, "public", "vitrina");
mkdirSync(destino, { recursive: true });

const BASE = "https://apvidaurri.com/img";
const TOTAL = 6;

let ok = 0;
for (let i = 1; i <= TOTAL; i++) {
  const salida = resolve(destino, `slide${i}.jpg`);
  if (existsSync(salida) && statSync(salida).size > 1000) {
    console.log(`= slide${i}.jpg (ya estaba, ${statSync(salida).size} b)`);
    ok++;
    continue;
  }
  try {
    const res = await fetch(`${BASE}/slide${i}.jpg`, {
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const tipo = res.headers.get("content-type") ?? "";
    if (!tipo.startsWith("image/")) throw new Error(`no es imagen (${tipo})`);
    const buffer = Buffer.from(await res.arrayBuffer());
    writeFileSync(salida, buffer);
    console.log(`+ slide${i}.jpg (${buffer.length} b, ${tipo})`);
    ok++;
  } catch (error) {
    console.log(`! slide${i}.jpg: ${error.message}`);
  }
}

console.log(`\n${ok}/${TOTAL} imágenes del carrusel en public/vitrina/`);
