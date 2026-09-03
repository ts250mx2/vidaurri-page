import type { Metadata } from "next";
import {
  buscarPiezasUsadas,
  listarMarcasUsadas,
  listarPartesUsadas,
  resumenBodega,
  type PiezaUsadaResumen,
} from "@/lib/usadas";
import { PRELLENADOS } from "@/config/negocio";
import { EncabezadoPagina } from "@/components/EncabezadoPagina";
import { TarjetaUsada } from "@/components/TarjetaUsada";
import { FiltrosBodega } from "@/components/usadas/FiltrosBodega";
import { PaginacionUsadas } from "@/components/usadas/PaginacionUsadas";
import { RescateUsadas } from "@/components/usadas/RescateUsadas";

// Catalogo de la Bodega Usado: piezas unicas con foto real. Filtros y
// paginacion 100% server-rendered (form GET + links), sin JavaScript.
// La base es remota y puede fallar: todo va en try/catch y la pagina degrada
// a rescate conversacional sin romperse.

export function generateMetadata(): Metadata {
  return {
    title: {
      absolute:
        "Piezas usadas de colisión con foto real | Autopartes Vidaurri Monterrey",
    },
    description:
      "Piezas usadas de colisión con existencia y foto real: ves la pieza exacta que recibes. Cada una es única — apártala hoy por WhatsApp o chat. Monterrey, N.L.",
  };
}

type ParametrosBusqueda = Record<string, string | string[] | undefined>;

function primero(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

function enteroPositivo(v: string): number | undefined {
  const n = Number.parseInt(v, 10);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

interface ResultadoBusqueda {
  total: number;
  page: number;
  pageSize: number;
  piezas: PiezaUsadaResumen[];
}

export default async function PaginaUsadas({
  searchParams,
}: {
  searchParams: Promise<ParametrosBusqueda>;
}) {
  const sp = await searchParams;
  const texto = primero(sp.texto);
  const idMarca = enteroPositivo(primero(sp.marca));
  const idParte = enteroPositivo(primero(sp.parte));
  const anioTexto = primero(sp.anio);
  const anio = /^\d{4}$/.test(anioTexto) ? Number(anioTexto) : undefined;
  const pagina = enteroPositivo(primero(sp.pagina)) ?? 1;

  // Catalogos de filtros y cifras: si la Bodega no responde, degradan a vacio.
  const [marcas, partes, resumen] = await Promise.all([
    listarMarcasUsadas().catch(() => []),
    listarPartesUsadas().catch(() => []),
    resumenBodega().catch(() => null),
  ]);

  let resultado: ResultadoBusqueda | null = null;
  try {
    resultado = await buscarPiezasUsadas({ texto, idMarca, idParte, anio, page: pagina });
  } catch {
    resultado = null;
  }

  // Descripcion humana de lo buscado, para los mensajes de rescate.
  const marcaNombre = marcas.find((m) => m.id === idMarca)?.marca ?? "";
  const parteNombre = partes.find((p) => p.id === idParte)?.parte ?? "";
  const termino =
    [texto, parteNombre, marcaNombre, anio ? String(anio) : ""]
      .filter(Boolean)
      .join(" ") || null;

  const filtrosQuery: Record<string, string> = {};
  if (idMarca) filtrosQuery.marca = String(idMarca);
  if (idParte) filtrosQuery.parte = String(idParte);
  if (texto) filtrosQuery.texto = texto;
  if (anio) filtrosQuery.anio = String(anio);

  const subtitulo =
    resumen && resumen.piezas > 0
      ? `${resumen.piezas.toLocaleString("es-MX")} piezas con existencia y ${resumen.fotos.toLocaleString("es-MX")} fotos reales — ves la pieza exacta que recibes.`
      : "Fotos reales de cada pieza — ves la pieza exacta que recibes.";

  const totalPaginas = resultado
    ? Math.max(1, Math.ceil(resultado.total / resultado.pageSize))
    : 1;

  return (
    <>
      <EncabezadoPagina
        titulo="Piezas usadas con foto real"
        descripcion={subtitulo}
        migas={[{ nombre: "Inicio", href: "/" }, { nombre: "Usadas" }]}
        documento={
          resultado && totalPaginas > 1
            ? `Hoja ${resultado.page} de ${totalPaginas}`
            : undefined
        }
      >
        <p className="mt-4 max-w-[65ch] text-sm text-white/75">
          Cada pieza usada es <strong className="text-white">única</strong>: cuando
          se va, se acabó. Si te late, apártala hoy por WhatsApp.
        </p>
      </EncabezadoPagina>

      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <FiltrosBodega
          marcas={marcas}
          partes={partes}
          valores={{
            marca: idMarca ? String(idMarca) : "",
            parte: idParte ? String(idParte) : "",
            texto,
            anio: anio ? String(anio) : "",
          }}
        />

        <section aria-label="Resultados de la bodega" className="mt-6">
          {resultado === null ? (
            <RescateUsadas
              titulo="La bodega de usadas no está respondiendo en este momento"
              descripcion="No eres tú, es nuestro sistema. Pregúntanos directo y buscamos la pieza a mano — la bodega física sigue abierta."
              textoWhatsApp={
                termino
                  ? `Hola, busco en usadas: ${termino}. Su página no me cargó los resultados, ¿me ayudas?`
                  : PRELLENADOS.generico
              }
              mensajeChat={
                termino
                  ? `Busco en las piezas usadas: ${termino}. ¿La tienen con existencia?`
                  : PRELLENADOS.generico
              }
            />
          ) : resultado.piezas.length === 0 ? (
            <RescateUsadas
              titulo="No encontramos esa pieza en la bodega"
              descripcion="La bodega cambia todos los días y no todo alcanza a subirse con foto. Pregúntanos y te decimos al momento si la tenemos o te la conseguimos."
              textoWhatsApp={PRELLENADOS.sinResultados(termino ?? "una pieza usada")}
              mensajeChat={`Busqué ${termino ?? "una pieza usada"} en las piezas usadas y no aparece. ¿Me la consiguen?`}
            />
          ) : (
            <>
              {/* Encabezado del listado: sin él, el h1 de la página saltaría
                  directo al h3 de cada ficha. */}
              <h2 className="sr-only">Piezas usadas encontradas</h2>
              <p className="mb-4 border-b border-linea pb-3 text-sm text-tinta-suave">
                <span className="num-tab font-mono font-semibold text-tinta">
                  {resultado.total.toLocaleString("es-MX")}
                </span>{" "}
                {resultado.total === 1 ? "pieza encontrada" : "piezas encontradas"}
              </p>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
                {resultado.piezas.map((pieza, i) => (
                  <TarjetaUsada key={pieza.id} p={pieza} indice={i} />
                ))}
              </div>

              <div className="mt-10">
                <PaginacionUsadas
                  paginaActual={resultado.page}
                  totalPaginas={totalPaginas}
                  filtros={filtrosQuery}
                />
              </div>
            </>
          )}
        </section>

        <p className="mt-12 max-w-[65ch] text-xs leading-relaxed text-tinta-suave">
          Aquí les decimos como tú les digas: facia o defensa, calavera o stop,
          cofre o capó, salpicadera o aleta.
        </p>
      </div>
    </>
  );
}
