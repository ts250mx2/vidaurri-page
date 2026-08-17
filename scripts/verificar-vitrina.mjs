// Comprueba que (a) cada marca surtida tenga su archivo de logo y (b) la
// vitrina de la home devuelva piezas con existencia, precio y foto real.
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(raiz, "package.json"));
const mysql = require("mysql2/promise");

const env = {};
for (const linea of readFileSync(resolve(raiz, ".env"), "utf8").split(/\r?\n/)) {
  const m = linea.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

// Mismo slugificar que src/lib/slug.ts
function slugificar(texto) {
  let ascii = "";
  for (const ch of texto.normalize("NFD")) if (ch.charCodeAt(0) <= 0x7f) ascii += ch;
  return ascii.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const conn = await mysql.createConnection({
  host: env.MYSQL_SERVER_SERVER,
  user: env.MYSQL_SERVER_USER,
  password: env.MYSQL_SERVER_PASSWORD,
  database: env.MYSQL_SERVER_DATABASE,
});

console.log("=== MARCAS SURTIDAS vs LOGO EN DISCO ===");
const [marcas] = await conn.query(
  `SELECT l.id, l.linea, COUNT(*) AS piezas
     FROM articulos a
     JOIN lineas l ON l.id = a.id_linea
    WHERE a.existencia > 0 AND IFNULL(a.precio_vta, 0) > 0
      AND l.linea <> '' AND l.linea NOT LIKE 'Z%'
    GROUP BY l.id, l.linea
   HAVING piezas >= 10
    ORDER BY piezas DESC`
);
let faltantes = 0;
for (const m of marcas) {
  const slug = slugificar(m.linea);
  const hay = existsSync(resolve(raiz, "public", "marcas", `${slug}.png`));
  if (!hay) faltantes++;
  console.log(`${hay ? "OK " : "-- "} ${m.linea.padEnd(20)} ${String(m.piezas).padStart(5)} piezas  (${slug}.png)`);
}
console.log(`${marcas.length} marcas surtidas, ${faltantes} sin archivo de logo (caen al nombre en texto)\n`);

console.log("=== VITRINA (piezas con existencia, precio y foto) ===");
const IDS = [5, 1, 28, 31, 18, 86, 3, 21];
const bloques = IDS.map(
  () => `(SELECT a.codigo, a.descripcion, a.imagen, a.id_parte AS idParte,
                 IFNULL(l.linea,'') AS marca, ROUND(IFNULL(a.precio_vta,0)*1.16,2) AS precio,
                 IFNULL(a.existencia,0) AS existencia
            FROM articulos a
            LEFT JOIN lineas l ON l.id = a.id_linea
           WHERE a.id_parte = ? AND a.existencia > 0 AND IFNULL(a.precio_vta,0) > 0
             AND a.imagen IS NOT NULL AND a.imagen <> '' AND IFNULL(l.linea,'') <> ''
           ORDER BY a.existencia DESC LIMIT 6)`
).join("\nUNION ALL\n");
const [filas] = await conn.query(
  `SELECT codigo, descripcion, imagen, idParte, marca, precio, existencia FROM (\n${bloques}\n) AS c`,
  IDS
);

const S3 = "https://s3-us-west-2.amazonaws.com/aldoautopartesproductos";
const conFoto = await Promise.all(
  filas.map(async (f) => {
    try {
      const r = await fetch(`${S3}/${encodeURIComponent(f.imagen?.trim() || f.codigo)}.jpg`, {
        method: "HEAD",
        signal: AbortSignal.timeout(8000),
      });
      return r.ok;
    } catch {
      return false;
    }
  })
);
const validos = filas.filter((_, i) => conFoto[i]);
console.log(`${filas.length} candidatos -> ${validos.length} con foto verificada`);
for (const v of validos.slice(0, 10)) {
  console.log(`  ${v.codigo.padEnd(16)} ${String(v.marca).padEnd(12)} $${v.precio}  ${v.descripcion.slice(0, 40)}`);
}

await conn.end();
