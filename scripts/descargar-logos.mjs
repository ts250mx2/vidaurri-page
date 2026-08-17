// Descarga UNA VEZ los logos de las marcas que Vidaurri surte, a public/marcas/.
// Se guardan en el repo (no se enlaza al origen en caliente) y se sirven desde
// el propio sitio. Mostrar la marca del fabricante cuya refaccion se vende es
// uso nominativo, practica estandar en refaccionarias.
//   node scripts/descargar-logos.mjs

import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const destino = resolve(raiz, "public", "marcas");
mkdirSync(destino, { recursive: true });

const BASE = "https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos/optimized";

// slug del sitio (slugificar(linea)) -> nombre del archivo en el dataset
const MARCAS = {
  chevrolet: "chevrolet",
  ford: "ford",
  toyota: "toyota",
  nissan: "nissan",
  honda: "honda",
  volkswagen: "volkswagen",
  "dodge-chrysler": "dodge",
  mazda: "mazda",
  jeep: "jeep",
  hyundai: "hyundai",
  kia: "kia",
  mitsubishi: "mitsubishi",
  renault: "renault",
  acura: "acura",
  seat: "seat",
  suzuki: "suzuki",
  peugeot: "peugeot",
  mg: "mg",
  "mercedes-benz": "mercedes-benz",
  bmw: "bmw",
  audi: "audi",
  fiat: "fiat",
  jac: "jac",
  cadillac: "cadillac",
};

let ok = 0;
let fallos = 0;

for (const [slug, archivo] of Object.entries(MARCAS)) {
  const salida = resolve(destino, `${slug}.png`);
  if (existsSync(salida)) {
    console.log(`= ${slug} (ya estaba)`);
    ok++;
    continue;
  }
  try {
    const res = await fetch(`${BASE}/${archivo}.png`, {
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    writeFileSync(salida, buffer);
    console.log(`+ ${slug}.png (${buffer.length} b)`);
    ok++;
  } catch (error) {
    console.log(`! ${slug}: ${error.message}`);
    fallos++;
  }
}

console.log(`\n${ok} logos listos, ${fallos} fallos -> public/marcas/`);
