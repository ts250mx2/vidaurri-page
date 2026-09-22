// Compacta el Catálogo Nacional de Códigos Postales de Correos de México en
// `data/sepomex.json.gz`, que es lo que lee `src/lib/cp/sepomex.ts`.
//
// Uso: descarga el catálogo (datos abiertos, sin registro):
//   curl -L -o /tmp/cpdescarga.txt https://www.correosdemexico.gob.mx/datosabiertos/cp/cpdescarga.txt
// y córrelo:
//   node scripts/armar-sepomex.mjs /tmp/cpdescarga.txt
//
// El archivo viene en latin1, separado por "|", con una línea de aviso y
// después la cabecera. Se queda solo con lo que el domicilio necesita: claves
// y nombres de estado y municipio, y por CP sus colonias (asentamientos).
// Se vuelve a correr cuando Correos publique un catálogo nuevo (unas veces al
// año); el JSON lleva la fecha en `version`.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

const origen = process.argv[2];
if (!origen) {
  console.error("Uso: node scripts/armar-sepomex.mjs <cpdescarga.txt>");
  process.exit(1);
}
const destino = path.join(process.cwd(), "data", "sepomex.json.gz");

const texto = new TextDecoder("latin1").decode(readFileSync(origen));
const lineas = texto.split(/\r?\n/);
const cabecera = lineas[1].split("|");
const idx = Object.fromEntries(cabecera.map((c, i) => [c, i]));
for (const columna of ["d_codigo", "d_asenta", "D_mnpio", "d_estado", "c_estado", "c_mnpio"]) {
  if (idx[columna] === undefined) {
    console.error(`El archivo no trae la columna ${columna}; ¿cambió el formato de Correos?`);
    process.exit(1);
  }
}

const estados = {};
const municipios = {};
const cps = {};
let filas = 0;
for (const linea of lineas.slice(2)) {
  if (!linea.trim()) continue;
  const c = linea.split("|");
  const cp = c[idx.d_codigo];
  const claveEstado = c[idx.c_estado];
  if (!cp || !claveEstado) continue;
  filas++;
  estados[claveEstado] = c[idx.d_estado];
  (municipios[claveEstado] ??= {})[c[idx.c_mnpio]] = c[idx.D_mnpio];
  const entrada = (cps[cp] ??= [claveEstado, c[idx.c_mnpio], []]);
  const colonia = c[idx.d_asenta];
  if (!entrada[2].includes(colonia)) entrada[2].push(colonia);
}

const json = JSON.stringify({ version: new Date().toISOString().slice(0, 10), estados, municipios, cps });
writeFileSync(destino, gzipSync(Buffer.from(json), { level: 9 }));
console.log(
  `${destino}: ${filas} filas → ${Object.keys(estados).length} estados, ` +
    `${Object.values(municipios).reduce((s, m) => s + Object.keys(m).length, 0)} municipios, ` +
    `${Object.keys(cps).length} códigos postales (${(json.length / 1e6).toFixed(1)} MB sin comprimir)`
);
