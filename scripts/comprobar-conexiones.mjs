// Diagnostico rapido de la infraestructura que necesita la web:
//   node scripts/comprobar-conexiones.mjs
// Comprueba bdav, la Bodega Usado y el webservice del Vendedor IA.

import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(resolve(raiz, "package.json"));
const mysql = require("mysql2/promise");

// .env plano KEY=VALUE (sin dependencias).
const env = {};
for (const linea of readFileSync(resolve(raiz, ".env"), "utf8").split(/\r?\n/)) {
  const m = linea.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

async function probarMysql(nombre, config, sql) {
  const inicio = Date.now();
  try {
    const conn = await mysql.createConnection({ ...config, connectTimeout: 8000 });
    const [filas] = await conn.query(sql);
    await conn.end();
    console.log(`[OK]    ${nombre} (${Date.now() - inicio} ms):`, JSON.stringify(filas[0]));
  } catch (error) {
    console.log(`[FALLA] ${nombre}: ${error.message}`);
  }
}

await probarMysql(
  "bdav",
  {
    host: env.MYSQL_SERVER_SERVER,
    user: env.MYSQL_SERVER_USER,
    password: env.MYSQL_SERVER_PASSWORD,
    database: env.MYSQL_SERVER_DATABASE,
  },
  "SELECT COUNT(*) AS articulos FROM articulos"
);

await probarMysql(
  "Bodega Usado",
  {
    host: env.MYSQL_USADAS_SERVER,
    port: Number(env.MYSQL_USADAS_PORT) || 3306,
    user: env.MYSQL_USADAS_USER,
    password: env.MYSQL_USADAS_PASSWORD,
    database: env.MYSQL_USADAS_DATABASE,
  },
  "SELECT COUNT(*) AS piezas FROM piezas WHERE existencia > 0"
);

try {
  const res = await fetch(`${env.VENDEDOR_IA_URL}/api/whatsapp/vendedor`, {
    signal: AbortSignal.timeout(8000),
  });
  const datos = await res.json();
  console.log(`[OK]    Webservice Vendedor IA (${env.VENDEDOR_IA_URL}):`, JSON.stringify(datos));
} catch (error) {
  console.log(`[FALLA] Webservice Vendedor IA (${env.VENDEDOR_IA_URL}): ${error.message}`);
}
