import { consultaBdav } from "@/lib/db";
import { conCache, TTL_CATALOGO_MS } from "@/lib/cache";
import { fotoAldoExiste } from "@/lib/aldo";

// Capa de datos PUBLICA del catalogo de piezas nuevas (bdav). Solo expone lo
// que un cliente puede ver: descripcion, compatibilidades, precio de venta CON
// IVA y si hay existencia (booleano). NUNCA exponer precio_cpa (costo),
// utilidad, minimos/maximos, localizacion en bodega ni datos de clientes.

export const IVA = 1.16;
const PAGE_SIZE = 24;
const PAGE_SIZE_MAX = 60;

export interface Marca {
  id: number;
  linea: string;
}

export interface TipoParte {
  id: number;
  parte: string;
}

export interface Modelo {
  id: number;
  modelo: string;
}

export interface ProductoResumen {
  codigo: string;
  descripcion: string;
  marca: string;
  tipoParte: string;
  aini: number | null;
  afin: number | null;
  precioConIva: number;
  enExistencia: boolean;
  /** Nombre de archivo de la foto en el S3. Normalmente es el código, pero
   *  algunos artículos comparten la foto de otro (columna `imagen`). */
  foto: string;
}

export interface ProductoDetalle extends ProductoResumen {
  id: number;
  aplicaciones: Array<{ modelo: string; aini: number | null; afin: number | null }>;
  codigosAlternos: string[];
}

export async function listarMarcas(): Promise<Marca[]> {
  return conCache("marcas", TTL_CATALOGO_MS, () =>
    consultaBdav<Marca>(
      "SELECT id, linea FROM lineas WHERE linea <> '' ORDER BY linea"
    )
  );
}

/** Marcas que el mostrador REALMENTE surte, ordenadas por piezas disponibles.
 *  `listarMarcas` devuelve las 48 líneas del catálogo (incluidas las de camión
 *  o sin una sola pieza); para la vitrina hay que enseñar solo lo que hay. */
export async function listarMarcasSurtidas(): Promise<
  Array<Marca & { piezas: number }>
> {
  return conCache("marcasSurtidas", TTL_CATALOGO_MS, () =>
    consultaBdav<Marca & { piezas: number }>(
      `SELECT l.id, l.linea, COUNT(*) AS piezas
         FROM articulos a
         JOIN lineas l ON l.id = a.id_linea
        WHERE a.existencia > 0 AND IFNULL(a.precio_vta, 0) > 0
          AND l.linea <> '' AND l.linea NOT LIKE 'Z%'
        GROUP BY l.id, l.linea
       HAVING piezas >= 10
        ORDER BY piezas DESC`
    )
  );
}

export async function listarTiposParte(): Promise<TipoParte[]> {
  return conCache("tiposParte", TTL_CATALOGO_MS, () =>
    consultaBdav<TipoParte>(
      "SELECT id, parte FROM partes WHERE parte <> '' ORDER BY parte"
    )
  );
}

export async function listarModelosDeMarca(idLinea: number): Promise<Modelo[]> {
  if (!Number.isInteger(idLinea) || idLinea <= 0) return [];
  return conCache(`modelos:${idLinea}`, TTL_CATALOGO_MS, () =>
    consultaBdav<Modelo>(
      "SELECT id, modelo FROM modelos WHERE id_linea = ? AND modelo <> '' ORDER BY modelo",
      [idLinea]
    )
  );
}

/** Rango de años con aplicaciones registradas para un modelo (para el select
 *  de año del buscador). Piezas sin rango capturado no acotan. */
export async function rangoAniosDeModelo(
  idModelo: number
): Promise<{ desde: number; hasta: number } | null> {
  if (!Number.isInteger(idModelo) || idModelo <= 0) return null;
  return conCache(`anios:${idModelo}`, TTL_CATALOGO_MS, async () => {
    const filas = await consultaBdav<{ desde: number | null; hasta: number | null }>(
      `SELECT MIN(NULLIF(am.aini, 0)) AS desde, MAX(NULLIF(am.afin, 0)) AS hasta
         FROM \`art-mod\` am
        WHERE am.id_modelo = ?`,
      [idModelo]
    );
    const r = filas[0];
    if (!r?.desde || !r?.hasta || r.desde < 1950 || r.hasta > 2100) return null;
    return { desde: r.desde, hasta: r.hasta };
  });
}

export interface FiltrosCatalogo {
  texto?: string;
  idLinea?: number;
  idModelo?: number;
  idParte?: number;
  anio?: number;
  soloExistencia?: boolean;
  page?: number;
  pageSize?: number;
}

interface FilaProducto {
  codigo: string;
  descripcion: string;
  marca: string;
  tipoParte: string;
  aini: number | null;
  afin: number | null;
  precioConIva: number;
  existencia: number;
  imagen: string | null;
}

function condicionesDe(f: FiltrosCatalogo): { where: string; params: unknown[] } {
  const condiciones: string[] = ["IFNULL(a.precio_vta, 0) > 0"];
  const params: unknown[] = [];

  const palabras = (f.texto ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 6);
  for (const palabra of palabras) {
    condiciones.push("(a.descripcion LIKE ? OR a.codigo LIKE ?)");
    params.push(`%${palabra}%`, `%${palabra}%`);
  }
  // Un solo termino con pinta de codigo tambien cruza codigos alternos (los
  // talleres buscan por numero OEM). IN + subquery, no EXISTS correlacionado:
  // codigos_alternos no tiene indice por id_articulo (leccion de vidaurri-ia).
  if (palabras.length === 1 && /^[a-z0-9-]{4,}$/i.test(palabras[0])) {
    const ultima = condiciones.pop()!;
    condiciones.push(
      `(${ultima} OR a.id IN (SELECT ca.id_articulo FROM codigos_alternos ca WHERE ca.codigo_alterno LIKE ?))`
    );
    params.push(`${palabras[0]}%`);
  }

  if (Number.isInteger(f.idLinea) && f.idLinea! > 0) {
    condiciones.push("a.id_linea = ?");
    params.push(f.idLinea);
  }
  if (Number.isInteger(f.idParte) && f.idParte! > 0) {
    condiciones.push("a.id_parte = ?");
    params.push(f.idParte);
  }
  if (Number.isInteger(f.idModelo) && f.idModelo! > 0) {
    if (Number.isInteger(f.anio) && f.anio! > 1950 && f.anio! < 2100) {
      condiciones.push(
        `a.id IN (SELECT am.id_articulo FROM \`art-mod\` am
                   WHERE am.id_modelo = ?
                     AND (IFNULL(am.aini, 0) = 0 OR am.aini <= ?)
                     AND (IFNULL(am.afin, 0) = 0 OR am.afin >= ?))`
      );
      params.push(f.idModelo, f.anio, f.anio);
    } else {
      condiciones.push(
        "a.id IN (SELECT am.id_articulo FROM \`art-mod\` am WHERE am.id_modelo = ?)"
      );
      params.push(f.idModelo);
    }
  } else if (Number.isInteger(f.anio) && f.anio! > 1950 && f.anio! < 2100) {
    condiciones.push("(a.aini IS NULL OR a.afin IS NULL OR ? BETWEEN a.aini AND a.afin)");
    params.push(f.anio);
  }
  if (f.soloExistencia) condiciones.push("a.existencia > 0");

  return { where: condiciones.join(" AND "), params };
}

export async function buscarProductos(
  f: FiltrosCatalogo
): Promise<{ total: number; page: number; pageSize: number; productos: ProductoResumen[] }> {
  const page = Math.max(1, Math.trunc(f.page ?? 1));
  const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, Math.trunc(f.pageSize ?? PAGE_SIZE)));
  const { where, params } = condicionesDe(f);
  const offset = (page - 1) * pageSize;

  const [filas, conteo] = await Promise.all([
    consultaBdav<FilaProducto>(
      `SELECT a.codigo, a.descripcion, a.imagen,
              IFNULL(l.linea, '') AS marca, IFNULL(p.parte, '') AS tipoParte,
              NULLIF(a.aini, 0) AS aini, NULLIF(a.afin, 0) AS afin,
              ROUND(IFNULL(a.precio_vta, 0) * ${IVA}, 2) AS precioConIva,
              IFNULL(a.existencia, 0) AS existencia
         FROM articulos a
         LEFT JOIN lineas l ON l.id = a.id_linea
         LEFT JOIN partes p ON p.id = a.id_parte
        WHERE ${where}
        ORDER BY (a.existencia > 0) DESC, a.precio_vta ASC, a.codigo ASC
        LIMIT ${offset}, ${pageSize}`,
      params
    ),
    consultaBdav<{ total: number }>(
      `SELECT COUNT(*) AS total FROM articulos a WHERE ${where}`,
      params
    ),
  ]);

  return {
    total: conteo[0]?.total ?? 0,
    page,
    pageSize,
    productos: filas.map(alPublico),
  };
}

function alPublico(fila: FilaProducto): ProductoResumen {
  return {
    codigo: fila.codigo,
    descripcion: fila.descripcion,
    marca: fila.marca,
    tipoParte: fila.tipoParte,
    aini: fila.aini,
    afin: fila.afin,
    precioConIva: fila.precioConIva,
    // Publico: solo SI/NO. La cifra exacta de inventario no se expone.
    enExistencia: fila.existencia > 0,
    foto: fila.imagen?.trim() || fila.codigo,
  };
}

export async function productoPorCodigo(codigo: string): Promise<ProductoDetalle | null> {
  const limpio = codigo.trim().slice(0, 30);
  if (!limpio) return null;

  const encabezados = await consultaBdav<FilaProducto & { id: number }>(
    `SELECT a.id, a.codigo, a.descripcion, a.imagen,
            IFNULL(l.linea, '') AS marca, IFNULL(p.parte, '') AS tipoParte,
            NULLIF(a.aini, 0) AS aini, NULLIF(a.afin, 0) AS afin,
            ROUND(IFNULL(a.precio_vta, 0) * ${IVA}, 2) AS precioConIva,
            IFNULL(a.existencia, 0) AS existencia
       FROM articulos a
       LEFT JOIN lineas l ON l.id = a.id_linea
       LEFT JOIN partes p ON p.id = a.id_parte
      WHERE a.codigo = ?
      LIMIT 1`,
    [limpio]
  );
  const articulo = encabezados[0];
  if (!articulo) return null;

  const [aplicaciones, alternos] = await Promise.all([
    consultaBdav<{ modelo: string; aini: number | null; afin: number | null }>(
      // La tabla lleva guion en el nombre: backticks obligatorios.
      `SELECT m.modelo, NULLIF(am.aini, 0) AS aini, NULLIF(am.afin, 0) AS afin
         FROM \`art-mod\` am
         JOIN modelos m ON m.id = am.id_modelo
        WHERE am.id_articulo = ?
        ORDER BY m.modelo ASC`,
      [articulo.id]
    ),
    consultaBdav<{ codigoAlterno: string }>(
      `SELECT ca.codigo_alterno AS codigoAlterno
         FROM codigos_alternos ca
        WHERE ca.id_articulo = ?
        ORDER BY ca.codigo_alterno ASC
        LIMIT 20`,
      [articulo.id]
    ),
  ]);

  return {
    ...alPublico(articulo),
    id: articulo.id,
    aplicaciones,
    codigosAlternos: alternos.map((a) => a.codigoAlterno),
  };
}

/** Cifras del catalogo para la franja de confianza (cacheadas 1 h). */
export async function resumenCatalogo(): Promise<{ piezasNuevas: number; marcas: number }> {
  return conCache("resumenCatalogo", TTL_CATALOGO_MS, async () => {
    const filas = await consultaBdav<{ piezasNuevas: number; marcas: number }>(
      `SELECT (SELECT COUNT(*) FROM articulos WHERE IFNULL(precio_vta, 0) > 0) AS piezasNuevas,
              (SELECT COUNT(*) FROM lineas WHERE linea <> '') AS marcas`
    );
    return filas[0] ?? { piezasNuevas: 0, marcas: 0 };
  });
}

// Candidatos que se revisan por tipo hasta encontrar uno CON foto en el S3.
// Hay artículos con mucha existencia pero sin foto (códigos genéricos), así que
// no basta con tomar el primero.
const CANDIDATOS_MUESTRA = 20;
const MS_ESPERA_FOTOS = 12000;

/** Un codigo de muestra CON FOTO por tipo de parte, para los mosaicos de la
 *  home. Devuelve mapa id_parte -> codigo (sin entrada si ninguno tiene foto).
 *  Cacheado 1 h porque verificar las fotos cuesta varias peticiones al S3.
 *
 *  Nota: bdav es MySQL 5.7 — nada de funciones de ventana (ROW_NUMBER); el
 *  "N por grupo" se arma con UNION ALL de subconsultas con LIMIT. */
export async function muestrasPorTipo(idsParte: number[]): Promise<Map<number, string>> {
  const ids = idsParte.filter((n) => Number.isInteger(n) && n > 0).slice(0, 12);
  if (ids.length === 0) return new Map();

  return conCache(`muestras:${ids.join(",")}`, TTL_CATALOGO_MS, async () => {
    // Los artículos con `imagen` capturada van primero: sin eso ganan por
    // existencia los códigos genéricos de mostrador (GENERICODE, EMB…), que
    // nunca tienen foto. Ojo: `imagen` vacía NO implica que no haya foto en el
    // S3, por eso solo ordena, no filtra.
    const bloques = ids
      .map(
        () => `(SELECT id_parte AS idParte, codigo, imagen
                  FROM articulos
                 WHERE id_parte = ? AND existencia > 0 AND IFNULL(precio_vta, 0) > 0
                 ORDER BY (imagen IS NOT NULL AND imagen <> '') DESC, existencia DESC
                 LIMIT ${CANDIDATOS_MUESTRA})`
      )
      .join("\nUNION ALL\n");

    // El SELECT externo no es adorno: garantizarSoloLectura() exige que el SQL
    // EMPIECE con un verbo de lectura, y el UNION ALL con LIMIT por bloque
    // obliga a abrir con paréntesis.
    const filas = await consultaBdav<{
      idParte: number;
      codigo: string;
      imagen: string | null;
    }>(`SELECT idParte, codigo, imagen FROM (\n${bloques}\n) AS candidatos`, ids);

    // Candidatos por tipo (nombre de archivo a pedirle al S3).
    const porTipo = new Map<number, string[]>();
    for (const f of filas) {
      const lista = porTipo.get(f.idParte) ?? [];
      lista.push(f.imagen?.trim() || f.codigo);
      porTipo.set(f.idParte, lista);
    }

    // Se verifica cada candidato en el S3 y gana el primero que sí tenga foto.
    // Con tope de tiempo: si el S3 va lento, la home sale igual (los tipos sin
    // resolver caen al respaldo visual de FotoPieza).
    const resolver = Promise.all(
      [...porTipo].map(async ([idParte, codigos]) => {
        const existe = await Promise.all(codigos.map((c) => fotoAldoExiste(c)));
        const i = existe.findIndex(Boolean);
        return [idParte, i >= 0 ? codigos[i] : null] as const;
      })
    );
    const espera = new Promise<Array<readonly [number, string | null]>>((r) =>
      setTimeout(() => r([]), MS_ESPERA_FOTOS)
    );
    const resueltos = await Promise.race([resolver, espera]);

    const mapa = new Map<number, string>();
    for (const [idParte, codigo] of resueltos) {
      if (codigo) mapa.set(idParte, codigo);
    }
    return mapa;
  });
}

/** Piezas con existencia, precio y FOTO VERIFICADA para la vitrina de la home.
 *  Intercala tipos para que el anaquel no salga con ocho cofres seguidos.
 *  Cacheado 1 h: verificar fotos cuesta varias peticiones al S3. */
export async function productosDeVitrina(
  idsParte: number[],
  limite = 8
): Promise<ProductoResumen[]> {
  const ids = idsParte.filter((n) => Number.isInteger(n) && n > 0).slice(0, 8);
  if (ids.length === 0) return [];

  return conCache(`vitrina:${ids.join(",")}:${limite}`, TTL_CATALOGO_MS, async () => {
    const porBloque = 6;
    const bloques = ids
      .map(
        () => `(SELECT a.codigo, a.descripcion, a.imagen, a.id_parte AS idParte,
                       IFNULL(l.linea, '') AS marca, IFNULL(p.parte, '') AS tipoParte,
                       NULLIF(a.aini, 0) AS aini, NULLIF(a.afin, 0) AS afin,
                       ROUND(IFNULL(a.precio_vta, 0) * ${IVA}, 2) AS precioConIva,
                       IFNULL(a.existencia, 0) AS existencia
                  FROM articulos a
                  LEFT JOIN lineas l ON l.id = a.id_linea
                  LEFT JOIN partes p ON p.id = a.id_parte
                 WHERE a.id_parte = ? AND a.existencia > 0
                   AND IFNULL(a.precio_vta, 0) > 0
                   AND a.imagen IS NOT NULL AND a.imagen <> ''
                   AND IFNULL(l.linea, '') <> ''
                 ORDER BY a.existencia DESC
                 LIMIT ${porBloque})`
      )
      .join("\nUNION ALL\n");

    // SELECT externo obligatorio: garantizarSoloLectura() rechaza un SQL que
    // abra con paréntesis (ver CLAUDE.md).
    const filas = await consultaBdav<FilaProducto & { idParte: number }>(
      `SELECT codigo, descripcion, imagen, idParte, marca, tipoParte,
              aini, afin, precioConIva, existencia
         FROM (\n${bloques}\n) AS candidatos`,
      ids
    );
    if (filas.length === 0) return [];

    const conFoto = await Promise.all(
      filas.map((f) => fotoAldoExiste(f.imagen?.trim() || f.codigo))
    );
    const validos = filas.filter((_, i) => conFoto[i]);

    // Rueda por tipo: uno de cada tipo antes de repetir, para variedad visual.
    const colas = new Map<number, Array<FilaProducto & { idParte: number }>>();
    for (const f of validos) {
      const cola = colas.get(f.idParte) ?? [];
      cola.push(f);
      colas.set(f.idParte, cola);
    }
    const salida: ProductoResumen[] = [];
    let quedan = true;
    while (salida.length < limite && quedan) {
      quedan = false;
      for (const cola of colas.values()) {
        const siguiente = cola.shift();
        if (!siguiente) continue;
        quedan = true;
        salida.push(alPublico(siguiente));
        if (salida.length >= limite) break;
      }
    }
    return salida;
  });
}

/** Piezas relacionadas para "se choca junto con": la colision nunca daña una
 *  sola pieza. Sugiere articulos con existencia del mismo vehiculo (misma
 *  marca, modelo por descripcion y traslape de años) pero de OTRO tipo de parte. */
export async function relacionadosDeGolpe(det: ProductoDetalle): Promise<ProductoResumen[]> {
  const modelo = (det.aplicaciones[0]?.modelo ?? "").split(/\s+/)[0] ?? "";
  if (!det.marca || !modelo) return [];
  const aini = det.aini ?? 0;
  const afin = det.afin ?? 9999;

  const filas = await consultaBdav<FilaProducto>(
    `SELECT a.codigo, a.descripcion, a.imagen,
            IFNULL(l.linea, '') AS marca, IFNULL(p.parte, '') AS tipoParte,
            NULLIF(a.aini, 0) AS aini, NULLIF(a.afin, 0) AS afin,
            ROUND(IFNULL(a.precio_vta, 0) * ${IVA}, 2) AS precioConIva,
            IFNULL(a.existencia, 0) AS existencia
       FROM articulos a
       JOIN lineas l ON l.id = a.id_linea
       LEFT JOIN partes p ON p.id = a.id_parte
      WHERE l.linea = ?
        AND a.codigo <> ?
        AND IFNULL(p.parte, '') <> ?
        AND IFNULL(a.precio_vta, 0) > 0
        AND a.existencia > 0
        AND (IFNULL(a.aini, 0) = 0 OR a.aini <= ?)
        AND (IFNULL(a.afin, 0) = 0 OR a.afin >= ?)
        AND a.descripcion LIKE ?
      ORDER BY (a.existencia > 0) DESC, RAND()
      LIMIT 4`,
    [det.marca, det.codigo, det.tipoParte, afin, aini, `%${modelo}%`]
  );
  return filas.map(alPublico);
}
