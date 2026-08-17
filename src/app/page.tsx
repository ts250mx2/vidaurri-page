import type { Metadata } from "next";
import {
  listarMarcasSurtidas,
  listarTiposParte,
  muestrasPorTipo,
  productosDeVitrina,
  resumenCatalogo,
  type ProductoResumen,
  type TipoParte,
} from "@/lib/catalogo";
import {
  buscarPiezasUsadas,
  resumenBodega,
  type PiezaUsadaResumen,
} from "@/lib/usadas";
import { Hero } from "@/components/home/Hero";
import { FranjaConfianza } from "@/components/home/FranjaConfianza";
import { VitrinaDestacados } from "@/components/home/VitrinaDestacados";
import { MosaicosTipos, type MosaicoTipo } from "@/components/home/MosaicosTipos";
import { GridMarcas } from "@/components/home/GridMarcas";
import { OpcionesCompra } from "@/components/home/OpcionesCompra";
import { FranjaAsistente } from "@/components/home/FranjaAsistente";
import { UsadasRecientes } from "@/components/home/UsadasRecientes";
import { BloqueB2B } from "@/components/home/BloqueB2B";
import { Sucursales } from "@/components/home/Sucursales";

// Home "Mostrador": todo sale del catálogo real. Cada consulta degrada por su
// cuenta (catch con fallback) para que la home nunca se caiga completa; la
// Bodega Usado es remota y su sección se oculta entera si no responde.

// ISR: cifras y usadas recientes se refrescan cada hora sin pegarle a la base
// en cada visita.
export const revalidate = 3600;

export const metadata: Metadata = {
  description:
    "Facias, cofres, faros, calaveras y más piezas de colisión en Monterrey: nuevas y usadas con foto real, con el precio con IVA a la vista. Cotiza por chat o WhatsApp y recoge en cualquiera de nuestras 2 sucursales. Más de 40 años surtiendo la hojalatería.",
  alternates: { canonical: "/" },
};

/** Tipos de pieza que más se chocan, en el orden del mostrador. Las claves se
 *  comparan sin acentos y en mayúsculas contra los nombres reales de la base. */
const OBJETIVOS: Array<{
  /** Nombre tal cual está capturado hoy en la tabla `partes`. */
  exacto: string;
  /** Respaldo si ese nombre cambia: prefijos aceptables, en orden. */
  claves: string[];
  etiqueta: string;
  corto: string;
}> = [
  { exacto: "DEFENSAS DELANTERAS", claves: ["FACIA", "DEFENSA"], etiqueta: "Facias (defensas)", corto: "Facias" },
  { exacto: "COFRES", claves: ["COFRE", "CAPO"], etiqueta: "Cofres (capós)", corto: "Cofres" },
  { exacto: "FAROS", claves: ["FARO"], etiqueta: "Faros", corto: "Faros" },
  { exacto: "CALAVERAS", claves: ["CALAVERA", "STOP"], etiqueta: "Calaveras (stops)", corto: "Calaveras" },
  { exacto: "ESPEJOS", claves: ["ESPEJO"], etiqueta: "Espejos", corto: "Espejos" },
  { exacto: "SALPICADERAS", claves: ["SALPICADERA", "ALETA"], etiqueta: "Salpicaderas (aletas)", corto: "Salpicaderas" },
  { exacto: "PARRILLAS", claves: ["PARRILLA"], etiqueta: "Parrillas", corto: "Parrillas" },
  { exacto: "PUERTAS", claves: ["PUERTA"], etiqueta: "Puertas", corto: "Puertas" },
];

const MAX_MOSAICOS = 8;
const MAX_POPULARES = 5;

/** Quita acentos con la misma técnica de lib/slug: NFD y descarte por punto
 *  de código, sin regex de rangos Unicode que los editores puedan corromper. */
function sinAcentos(texto: string): string {
  let ascii = "";
  for (const ch of texto.normalize("NFD")) {
    if (ch.charCodeAt(0) <= 0x7f) ascii += ch;
  }
  return ascii;
}

/** Resuelve cada objetivo contra los nombres reales de la tabla `partes`:
 *  primero por nombre exacto, si no por PREFIJO (el más corto), y solo al final
 *  por coincidencia suelta. El prefijo importa: buscar "DEFENSA" con `includes`
 *  premiaba a "GUIAS DE DEFENSA" sobre "DEFENSAS DELANTERAS" por ser más corto. */
function tiposDestacados(
  tipos: TipoParte[]
): Array<{ id: number; etiqueta: string; corto: string }> {
  const usados = new Set<number>();
  const resultado: Array<{ id: number; etiqueta: string; corto: string }> = [];
  const normalizado = tipos.map((t) => ({ ...t, norm: sinAcentos(t.parte.toUpperCase()).trim() }));
  const masCorto = <T extends { parte: string }>(lista: T[]) =>
    lista.reduce((a, b) => (b.parte.length < a.parte.length ? b : a));

  for (const objetivo of OBJETIVOS) {
    const libres = normalizado.filter((t) => !usados.has(t.id));
    const exacto = libres.find((t) => t.norm === objetivo.exacto);
    const porPrefijo = libres.filter((t) =>
      objetivo.claves.some((clave) => t.norm.startsWith(clave))
    );
    const porContenido = libres.filter((t) =>
      objetivo.claves.some((clave) => t.norm.includes(clave))
    );

    const elegido =
      exacto ??
      (porPrefijo.length > 0
        ? masCorto(porPrefijo)
        : porContenido.length > 0
          ? masCorto(porContenido)
          : null);

    if (!elegido) continue;
    usados.add(elegido.id);
    resultado.push({ id: elegido.id, etiqueta: objetivo.etiqueta, corto: objetivo.corto });
  }
  return resultado.slice(0, MAX_MOSAICOS);
}

export default async function PaginaInicio() {
  // Consultas independientes en paralelo; cada una degrada por separado.
  // `listarMarcasSurtidas` (no `listarMarcas`): la vitrina enseña solo marcas
  // con piezas disponibles, ordenadas por volumen — el catálogo completo trae
  // líneas de camión y marcas sin una sola pieza.
  const [marcas, tipos, resumen, bodega, usadas] = await Promise.all([
    listarMarcasSurtidas().catch(() => []),
    listarTiposParte().catch(() => []),
    resumenCatalogo().catch(() => null),
    resumenBodega().catch(() => null),
    buscarPiezasUsadas({ page: 1, pageSize: 8 })
      .then((r) => r.piezas)
      .catch(() => [] as PiezaUsadaResumen[]),
  ]);

  const destacados = tiposDestacados(tipos);
  const muestras = await muestrasPorTipo(destacados.map((d) => d.id)).catch(
    (error) => {
      // Degrada al respaldo visual, pero deja rastro: un fallo silencioso aquí
      // vacía los mosaicos sin que nada lo delate.
      console.error("No se pudieron resolver las fotos de los mosaicos:", error);
      return new Map<number, string>();
    }
  );

  const mosaicos: MosaicoTipo[] = destacados.map((d) => ({
    id: d.id,
    etiqueta: d.etiqueta,
    codigo: muestras.get(d.id) ?? null,
  }));
  const populares = destacados
    .slice(0, MAX_POPULARES)
    .map((d) => ({ id: d.id, nombre: d.corto }));

  // El muro del hero se viste con las mismas fotos ya verificadas de los
  // mosaicos. Si el S3 no resolvió ninguna, queda grafito liso y no se rompe.
  const codigosMuro = destacados.flatMap((d) => {
    const codigo = muestras.get(d.id);
    return codigo ? [codigo] : [];
  });

  // Mercancía real con precio para la vitrina: es lo que hace que la portada
  // se sienta tienda. Si falla, la sección simplemente no se pinta.
  const vitrina = await productosDeVitrina(destacados.map((d) => d.id), 12).catch(
    (error) => {
      console.error("No se pudo armar la vitrina de la home:", error);
      return [] as ProductoResumen[];
    }
  );

  const piezasNuevas =
    resumen && resumen.piezasNuevas > 0 ? resumen.piezasNuevas : null;
  const piezasUsadas = bodega && bodega.piezas > 0 ? bodega.piezas : null;

  const fmt = (n: number) => n.toLocaleString("es-MX");
  const subtitulo = piezasNuevas
    ? `Búscala entre ${fmt(piezasNuevas)} piezas nuevas${
        piezasUsadas ? ` y ${fmt(piezasUsadas)} usadas con foto real` : ""
      }, con el precio con IVA a la vista, para recoger hoy en Monterrey.`
    : "Refacciones de colisión nuevas y usadas con el precio con IVA a la vista, para recoger hoy en Monterrey.";

  return (
    <>
      {/* Orden comercial: buscador, credenciales, y ENSEGUIDA mercancía con
          precio. Las secciones de servicio (asistente, mayoreo, sucursales)
          van después: en una tienda primero se ve lo que hay. */}
      <Hero
        marcas={marcas}
        tipos={tipos}
        subtitulo={subtitulo}
        populares={populares}
        codigosMuro={codigosMuro}
      />
      <FranjaConfianza piezasNuevas={piezasNuevas} piezasUsadas={piezasUsadas} />
      <VitrinaDestacados productos={vitrina} />
      <MosaicosTipos items={mosaicos} />
      <UsadasRecientes piezas={usadas} />
      <GridMarcas marcas={marcas} />
      <OpcionesCompra />
      <FranjaAsistente />
      <BloqueB2B />
      <Sucursales />
    </>
  );
}
