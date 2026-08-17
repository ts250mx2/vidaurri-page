// Marcas reales del catalogo, ordenadas por piezas con existencia.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
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

const conn = await mysql.createConnection({
  host: env.MYSQL_SERVER_SERVER,
  user: env.MYSQL_SERVER_USER,
  password: env.MYSQL_SERVER_PASSWORD,
  database: env.MYSQL_SERVER_DATABASE,
});

const [filas] = await conn.query(
  `SELECT l.id, l.linea, COUNT(*) AS conExistencia
     FROM articulos a
     JOIN lineas l ON l.id = a.id_linea
    WHERE a.existencia > 0 AND IFNULL(a.precio_vta, 0) > 0
    GROUP BY l.id, l.linea
    ORDER BY conExistencia DESC`
);

console.log(`marcas con existencia: ${filas.length}`);
for (const f of filas) console.log(`${f.id}\t${f.linea}\t${f.conExistencia}`);

const [[t]] = await conn.query("SELECT COUNT(*) AS n FROM lineas WHERE linea <> ''");
console.log(`\ntotal de lineas en catalogo: ${t.n}`);

await conn.end();
