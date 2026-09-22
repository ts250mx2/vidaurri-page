import { readFile } from "node:fs/promises";
import path from "node:path";
import { gunzipSync } from "node:zlib";

// El Catálogo Nacional de Códigos Postales de Correos de México (SEPOMEX),
// compactado en `data/sepomex.json.gz` por `scripts/armar-sepomex.mjs`: 32
// estados, ~2,460 municipios y ~32,300 códigos postales con sus colonias. Es
// lo que prellena el domicilio del pedido al teclear el CP. Vive en la página
// y no en una base: es un catálogo público, estático, de 1 MB comprimido, y
// así el mostrador, el kiosco y el área de clientes lo consultan sin sesión
// y sin tocar bdav ni IA. Se descomprime una vez por proceso y se queda en
// memoria (~3 MB). Solo servidor: `node:zlib` no existe en el navegador.

const RUTA_CATALOGO = path.join(process.cwd(), "data", "sepomex.json.gz");

interface Catalogo {
  version: string;
  /** clave de estado ('19') → nombre. */
  estados: Record<string, string>;
  /** clave de estado → clave de municipio ('039') → nombre. */
  municipios: Record<string, Record<string, string>>;
  /** CP → [clave estado, clave municipio, colonias]. */
  cps: Record<string, [string, string, string[]]>;
}

export interface Lugar {
  clave: string;
  nombre: string;
}

export interface ResultadoCp {
  cp: string;
  estado: Lugar;
  municipio: Lugar;
  colonias: string[];
}

const ES_CP = /^\d{5}$/;
const ES_CLAVE_ESTADO = /^\d{2}$/;

let catalogo: Promise<Catalogo> | null = null;

function cargar(): Promise<Catalogo> {
  catalogo ??= readFile(RUTA_CATALOGO)
    .then((bytes) => JSON.parse(gunzipSync(bytes).toString("utf8")) as Catalogo)
    .catch((error: unknown) => {
      // Se vuelve a intentar en la siguiente consulta: un fallo de disco no
      // debe dejar sin catálogo al proceso hasta que lo reinicien.
      catalogo = null;
      throw error;
    });
  return catalogo;
}

function ordenar(lugares: Lugar[]): Lugar[] {
  return [...lugares].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/** Los 32 estados, por nombre. */
export async function listarEstados(): Promise<Lugar[]> {
  const { estados } = await cargar();
  return ordenar(Object.entries(estados).map(([clave, nombre]) => ({ clave, nombre })));
}

/** Los municipios de un estado, por nombre; [] si la clave no existe. */
export async function listarMunicipios(claveEstado: string): Promise<Lugar[]> {
  if (!ES_CLAVE_ESTADO.test(claveEstado)) return [];
  const { municipios } = await cargar();
  return ordenar(Object.entries(municipios[claveEstado] ?? {}).map(([clave, nombre]) => ({ clave, nombre })));
}

/** Estado, municipio y colonias de un CP; null si no está en el catálogo. */
export async function consultarCp(cp: string): Promise<ResultadoCp | null> {
  if (!ES_CP.test(cp)) return null;
  const { estados, municipios, cps } = await cargar();
  const entrada = cps[cp];
  if (!entrada) return null;
  const [claveEstado, claveMunicipio, colonias] = entrada;
  return {
    cp,
    estado: { clave: claveEstado, nombre: estados[claveEstado] ?? "" },
    municipio: { clave: claveMunicipio, nombre: municipios[claveEstado]?.[claveMunicipio] ?? "" },
    colonias: [...colonias].sort((a, b) => a.localeCompare(b, "es")),
  };
}
