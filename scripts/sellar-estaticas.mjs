// Estampa el sello de la casa en las fotos ESTÁTICAS del sitio (el carrusel de
// la vitrina). Son fotos de la bodega propia, así que salen marcadas igual que
// las del catálogo — solo que aquí el sellado se hace una vez, al preparar el
// asset, en vez de en cada petición.
//
// Los originales viven en assets/vitrina/ (fuera de public/, no se publican) y
// esta receta los vuelve a generar en public/vitrina/. Correrlo dos veces da el
// mismo resultado: siempre parte del original, nunca de la copia ya sellada.
//
//   node scripts/sellar-estaticas.mjs

import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(raiz, "package.json"));
const sharp = require("sharp");

// Mismas proporciones que src/lib/marca-agua.ts, para que el sello se vea igual
// en una foto del carrusel que en una de la parrilla.
const PROPORCION = 0.32;
const PROPORCION_CHICA = 0.46;
const ANCHO_CHICO = 400;
const MARGEN = 0.03;
const OPACIDAD = 0.74;

const ORIGEN = join(raiz, "assets", "vitrina");
const DESTINO = join(raiz, "public", "vitrina");

const marca = await readFile(join(raiz, "public", "marca-agua.png"));

async function sellar(bytes) {
  const foto = sharp(bytes, { failOn: "none" });
  const { width, height } = await foto.metadata();
  if (!width || !height) throw new Error("no se pudo leer el tamaño");

  const anchoSello = Math.round(
    width * (width < ANCHO_CHICO ? PROPORCION_CHICA : PROPORCION)
  );
  const sello = await sharp(marca)
    .resize({ width: anchoSello })
    .composite([
      {
        input: Buffer.from([0, 0, 0, Math.round(OPACIDAD * 255)]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();
  const { height: altoSello = 0 } = await sharp(sello).metadata();
  const margen = Math.round(width * MARGEN);

  return foto
    .composite([
      {
        input: sello,
        top: Math.max(0, height - altoSello - margen),
        left: Math.max(0, width - anchoSello - margen),
      },
    ])
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();
}

await mkdir(DESTINO, { recursive: true });
const archivos = (await readdir(ORIGEN)).filter((f) => /\.jpe?g$/i.test(f));

for (const archivo of archivos) {
  const bytes = await readFile(join(ORIGEN, archivo));
  const salida = await sellar(bytes);
  await writeFile(join(DESTINO, archivo), salida);
  const kb = (n) => Math.round(n / 1024);
  console.log(`${archivo}: ${kb(bytes.length)} KB → ${kb(salida.length)} KB sellada`);
}
console.log(`${archivos.length} fotos del carrusel selladas`);
