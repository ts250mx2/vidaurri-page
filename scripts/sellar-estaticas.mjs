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
// en una foto del carrusel que en una de la parrilla. Si cambias uno, cambia el
// otro: son las dos mitades de la misma marca.
const PROPORCION = 0.32;
const PROPORCION_CHICA = 0.46;
const ANCHO_CHICO = 400;
const MARGEN = 0.03;
const OPACIDAD = 0.74;
const MOSAICO_ANCHO = 0.22;
const MOSAICO_SEPARACION = 0.1;
const MOSAICO_OPACIDAD = 0.16;
const MOSAICO_GRADOS = -30;

const ORIGEN = join(raiz, "assets", "vitrina");
const DESTINO = join(raiz, "public", "vitrina");
const TRANSPARENTE = { r: 0, g: 0, b: 0, alpha: 0 };

const marca = await readFile(join(raiz, "public", "marca-agua.png"));

const velo = (opacidad) => ({
  input: Buffer.from([0, 0, 0, Math.round(opacidad * 255)]),
  raw: { width: 1, height: 1, channels: 4 },
  tile: true,
  blend: "dest-in",
});

/** Azulejo con dos logos en diagonal: al repetirse, filas escalonadas. */
async function azulejoMosaico(anchoLogo) {
  const chico = await sharp(marca).resize({ width: anchoLogo }).png().toBuffer();
  const logo = await sharp(chico)
    .rotate(MOSAICO_GRADOS, { background: TRANSPARENTE })
    .png()
    .toBuffer();
  const { width, height } = await sharp(logo).metadata();
  const aireX = Math.round(width * MOSAICO_SEPARACION);
  const aireY = Math.round(height * MOSAICO_SEPARACION);
  const celdaAncho = width + aireX;
  const celdaAlto = height + aireY;

  const trama = await sharp({
    create: {
      width: celdaAncho * 2,
      height: celdaAlto * 2,
      channels: 4,
      background: TRANSPARENTE,
    },
  })
    .composite([
      { input: logo, top: Math.round(aireY / 2), left: Math.round(aireX / 2) },
      {
        input: logo,
        top: celdaAlto + Math.round(aireY / 2),
        left: celdaAncho + Math.round(aireX / 2),
      },
    ])
    .png()
    .toBuffer();

  // Segunda pasada: sharp no acumula composite() encadenados.
  return sharp(trama).composite([velo(MOSAICO_OPACIDAD)]).png().toBuffer();
}

async function sellar(bytes) {
  const foto = sharp(bytes, { failOn: "none" });
  const { width, height } = await foto.metadata();
  if (!width || !height) throw new Error("no se pudo leer el tamaño");

  const anchoEsquina = Math.round(
    width * (width < ANCHO_CHICO ? PROPORCION_CHICA : PROPORCION)
  );
  const [azulejo, sello] = await Promise.all([
    azulejoMosaico(Math.round(width * MOSAICO_ANCHO)),
    sharp(marca).resize({ width: anchoEsquina }).composite([velo(OPACIDAD)]).png().toBuffer(),
  ]);
  const { height: altoSello = 0 } = await sharp(sello).metadata();
  const margen = Math.round(width * MARGEN);

  return foto
    .composite([
      { input: azulejo, tile: true, blend: "over" },
      {
        input: sello,
        top: Math.max(0, height - altoSello - margen),
        left: Math.max(0, width - anchoEsquina - margen),
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
