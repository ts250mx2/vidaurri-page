import { consultaUsadas } from "@/lib/db-usadas";
import { conCache, TTL_CATALOGO_MS } from "@/lib/cache";
import { raizBusqueda } from "@/lib/texto";
import { IVA } from "@/lib/catalogo";

// Capa de datos PUBLICA de la Bodega Usado (base remota wwapvi_bd-usadas).
// Solo piezas con existencia y solo campos de cara al cliente: descripcion,
// vehiculo, años, precio CON IVA y fotos reales. La ubicacion fisica en bodega
// (modulo/casillero) NO se expone.

const PAGE_SIZE = 24;
const PAGE_SIZE_MAX = 60;

export interface MarcaUsadas {
  id: number;
  marca: string;
}

export interface ParteUsadas {
  id: number;
  parte: string;
}

export interface PiezaUsadaResumen {
  id: number;
  codigo: string;
  descripcion: string;
  marca: string;
  modelo: string;
  tipoParte: string;
  anioInicio: number | null;
  anioFin: number | null;
  precioConIva: number | null;
  /** nombre_imagen de la primera foto activa (null si no tiene). */
  foto: string | null;
  numFotos: number;
}

export interface PiezaUsadaDetalle extends PiezaUsadaResumen {
  fotos: string[];
}

export async function listarMarcasUsadas(): Promise<MarcaUsadas[]> {
  return conCache("usadas:marcas", TTL_CATALOGO_MS, () =>
    consultaUsadas<MarcaUsadas>(
      `SELECT DISTINCT ma.id_marca AS id, ma.marca
         FROM marcas ma
         JOIN modelos mo ON mo.id_marca = ma.id_marca
         JOIN piezas p ON p.id_modelo = mo.id_modelo AND p.existencia > 0
        WHERE ma.marca <> ''
        ORDER BY ma.marca`
    )
  );
}

export async function listarPartesUsadas(): Promise<ParteUsadas[]> {
  return conCache("usadas:partes", TTL_CATALOGO_MS, () =>
    consultaUsadas<ParteUsadas>(
      `SELECT DISTINCT pa.id_parte AS id, pa.parte
         FROM partes pa
         JOIN piezas p ON p.id_parte = pa.id_parte AND p.existencia > 0
        WHERE pa.parte <> ''
        ORDER BY pa.parte`
    )
  );
}

export interface FiltrosUsadas {
  texto?: string;
  idMarca?: number;
  idParte?: number;
  anio?: number;
  page?: number;
  pageSize?: number;
}

interface FilaPieza {
  id: number;
  codigo: string;
  descripcion: string;
  marca: string;
  modelo: string;
  tipoParte: string;
  anioInicio: number | null;
  anioFin: number | null;
  precioSinIva: number;
  foto: string | null;
  numFotos: number;
}

const CAMPOS_PIEZA = `
  p.id_pieza AS id, p.codigo, p.descripcion,
  IFNULL(ma.marca, '') AS marca, IFNULL(mo.modelo, '') AS modelo,
  IFNULL(pa.parte, '') AS tipoParte,
  NULLIF(p.anio_inicio, 0) AS anioInicio, NULLIF(p.anio_fin, 0) AS anioFin,
  IFNULL(p.precio, 0) AS precioSinIva,
  (SELECT pi.nombre_imagen FROM piezas_imagenes pi
    WHERE pi.id_pieza = p.id_pieza AND pi.activo = 1 AND pi.consecutivo >= 1
    ORDER BY pi.consecutivo LIMIT 1) AS foto,
  (SELECT COUNT(*) FROM piezas_imagenes pi
    WHERE pi.id_pieza = p.id_pieza AND pi.activo = 1) AS numFotos`;

const JOINS_PIEZA = `
  FROM piezas p
  LEFT JOIN partes pa ON pa.id_parte = p.id_parte
  LEFT JOIN modelos mo ON mo.id_modelo = p.id_modelo
  LEFT JOIN marcas ma ON ma.id_marca = mo.id_marca`;

function alPublico(fila: FilaPieza): PiezaUsadaResumen {
  return {
    id: fila.id,
    codigo: fila.codigo,
    descripcion: fila.descripcion,
    marca: fila.marca,
    modelo: fila.modelo,
    tipoParte: fila.tipoParte,
    anioInicio: fila.anioInicio,
    anioFin: fila.anioFin,
    precioConIva:
      fila.precioSinIva > 0 ? Math.round(fila.precioSinIva * IVA * 100) / 100 : null,
    foto: fila.foto,
    numFotos: fila.numFotos,
  };
}

export async function buscarPiezasUsadas(
  f: FiltrosUsadas
): Promise<{ total: number; page: number; pageSize: number; piezas: PiezaUsadaResumen[] }> {
  const page = Math.max(1, Math.trunc(f.page ?? 1));
  const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, Math.trunc(f.pageSize ?? PAGE_SIZE)));

  const condiciones: string[] = ["p.existencia > 0"];
  const params: unknown[] = [];

  // Cada palabra cruza descripcion/codigo/parte/marca/modelo por raiz, igual
  // que la herramienta del Vendedor IA ("delantera" -> "delanter" cruza con
  // capturas tipo "DELANTERO(A)").
  const palabras = (f.texto ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 6);
  for (const palabra of palabras) {
    condiciones.push(
      "(p.descripcion LIKE ? OR p.codigo LIKE ? OR pa.parte LIKE ? OR ma.marca LIKE ? OR mo.modelo LIKE ?)"
    );
    const like = `%${raizBusqueda(palabra)}%`;
    params.push(like, like, like, like, like);
  }
  if (Number.isInteger(f.idMarca) && f.idMarca! > 0) {
    condiciones.push("ma.id_marca = ?");
    params.push(f.idMarca);
  }
  if (Number.isInteger(f.idParte) && f.idParte! > 0) {
    condiciones.push("p.id_parte = ?");
    params.push(f.idParte);
  }
  if (Number.isInteger(f.anio) && f.anio! > 1950 && f.anio! < 2100) {
    condiciones.push(
      "(IFNULL(p.anio_inicio, 0) = 0 OR IFNULL(p.anio_fin, 0) = 0 OR ? BETWEEN p.anio_inicio AND p.anio_fin)"
    );
    params.push(f.anio);
  }

  const where = condiciones.join(" AND ");
  const offset = (page - 1) * pageSize;

  const [filas, conteo] = await Promise.all([
    consultaUsadas<FilaPieza>(
      `SELECT ${CAMPOS_PIEZA} ${JOINS_PIEZA}
        WHERE ${where}
        ORDER BY (IFNULL(p.precio, 0) > 0) DESC, p.id_pieza DESC
        LIMIT ${offset}, ${pageSize}`,
      params
    ),
    consultaUsadas<{ total: number }>(
      `SELECT COUNT(*) AS total ${JOINS_PIEZA} WHERE ${where}`,
      params
    ),
  ]);

  return { total: conteo[0]?.total ?? 0, page, pageSize, piezas: filas.map(alPublico) };
}

export async function piezaUsadaPorId(id: number): Promise<PiezaUsadaDetalle | null> {
  if (!Number.isInteger(id) || id <= 0) return null;

  const filas = await consultaUsadas<FilaPieza>(
    `SELECT ${CAMPOS_PIEZA} ${JOINS_PIEZA}
      WHERE p.id_pieza = ? AND p.existencia > 0
      LIMIT 1`,
    [id]
  );
  const pieza = filas[0];
  if (!pieza) return null;

  const fotos = await consultaUsadas<{ nombre: string }>(
    `SELECT pi.nombre_imagen AS nombre
       FROM piezas_imagenes pi
      WHERE pi.id_pieza = ? AND pi.activo = 1 AND pi.consecutivo >= 1
      ORDER BY pi.consecutivo
      LIMIT 12`,
    [id]
  );

  return { ...alPublico(pieza), fotos: fotos.map((f) => f.nombre) };
}

/** Raiz del tipo de parte para cruzar catalogos (bdav usa plural "FAROS", la
 *  Bodega singular "FARO"). Mismo criterio que el Vendedor IA. */
function raizParte(parte: string): string {
  const primera = parte.trim().toUpperCase().split(/\s+/)[0] ?? "";
  return primera.replace(/S$/, "");
}

/** Piezas usadas equivalentes a un articulo nuevo (marca + raiz del tipo de
 *  parte + traslape de años). Para el comparador nueva-vs-usada de la ficha.
 *  Si la Bodega no responde, devuelve lista vacia: la venta de nuevo no se
 *  bloquea por la base remota. */
export async function usadasEquivalentes(articulo: {
  marca: string;
  tipoParte: string;
  aini: number | null;
  afin: number | null;
}): Promise<PiezaUsadaResumen[]> {
  const raiz = raizParte(articulo.tipoParte);
  const marca = articulo.marca.trim();
  if (!raiz || !marca) return [];

  const condiciones = [
    "p.existencia > 0",
    "pa.parte LIKE ?",
    // La marca puede venir compuesta en la Bodega ("DODGE / CHRYSLER").
    "(ma.marca LIKE ? OR ? LIKE CONCAT('%', ma.marca, '%'))",
  ];
  const params: unknown[] = [`${raiz}%`, `%${marca}%`, marca];

  const aini = Number(articulo.aini);
  const afin = Number(articulo.afin);
  if (aini > 1900 && afin > 1900) {
    condiciones.push(
      "(IFNULL(p.anio_inicio, 0) = 0 OR p.anio_inicio <= ?)",
      "(IFNULL(p.anio_fin, 0) = 0 OR p.anio_fin >= ?)"
    );
    params.push(afin, aini);
  }

  try {
    const filas = await consultaUsadas<FilaPieza>(
      `SELECT ${CAMPOS_PIEZA} ${JOINS_PIEZA}
        WHERE ${condiciones.join(" AND ")}
        ORDER BY (IFNULL(p.precio, 0) > 0) DESC, p.precio ASC
        LIMIT 4`,
      params
    );
    return filas.map(alPublico);
  } catch (error) {
    console.error("Bodega Usado sin respuesta al buscar equivalentes:", error);
    return [];
  }
}

/** Cifras para la home y la franja de confianza (cacheadas 1 h). */
export async function resumenBodega(): Promise<{ piezas: number; fotos: number }> {
  return conCache("usadas:resumen", TTL_CATALOGO_MS, async () => {
    try {
      const filas = await consultaUsadas<{ piezas: number; fotos: number }>(
        `SELECT (SELECT COUNT(*) FROM piezas WHERE existencia > 0) AS piezas,
                (SELECT COUNT(*) FROM piezas_imagenes WHERE activo = 1) AS fotos`
      );
      return filas[0] ?? { piezas: 0, fotos: 0 };
    } catch {
      return { piezas: 0, fotos: 0 };
    }
  });
}
