import type { Metadata } from "next";
import Link from "next/link";
import { notFound, unstable_rethrow } from "next/navigation";
import { ChevronLeft, FileDown } from "lucide-react";
import clsx from "clsx";
import { MarcaAV } from "@/components/LogoAV";
import { NEGOCIO, urlSitio } from "@/config/negocio";
import { svgCodigo128 } from "@/lib/mostrador/codigo128";
import { hojaSurtido } from "@/lib/mostrador/datos";
import { svgQr } from "@/lib/mostrador/qr";
import { ETIQUETA_ORIGEN, fechaHora, telefonoLegible } from "@/lib/mostrador/etiquetas";
import { primero } from "@/lib/mostrador/filtros";
import { idDeRuta } from "@/lib/mostrador/reenvio";
import { ETIQUETA_ESTATUS } from "@/lib/mostrador/reglas";
import type { HojaSurtido, RenglonSurtido } from "@/lib/mostrador/tipos";
import { RUTA_MOSTRADOR } from "@/lib/mostrador/volver";
import { BotonImprimir } from "./BotonImprimir";
import { ImpresionAutomatica } from "./ImpresionAutomatica";

// Hoja de surtido: lo que se lleva el almacenista al anaquel. Va sin precios
// a propósito (aquí se surte, no se cobra) y con la existencia releída por IA
// al momento de generarla, no la de la captura. Al imprimir desaparecen la
// barra del mostrador y los botones (`solo-pantalla`); lo demás es papel.
// La cabecera lleva el folio como código de barras (lo lee el lector del POS)
// y un QR con la liga al pedido (lo abre el almacenista desde el celular).
// Con `?imprimir=1` (el botón "Imprimir orden" del detalle la abre así en
// otra pestaña) el diálogo de impresión sale solo al cargar.

export const metadata: Metadata = {
  title: "Hoja de surtido · Mostrador",
};

interface Contexto {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** `?imprimir=1` exacto; cualquier otra cosa se ignora. */
function pideImpresion(sp: Record<string, string | string[] | undefined>): boolean {
  return primero(sp.imprimir) === "1";
}

interface CargaHoja {
  hoja: HojaSurtido | null;
  error: string | null;
}

async function cargarHoja(id: number): Promise<CargaHoja> {
  try {
    return { hoja: await hojaSurtido(id), error: null };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[mostrador] fallo armando la hoja de surtido", id, error);
    return { hoja: null, error: error instanceof Error ? error.message : "No fue posible armar la hoja" };
  }
}

const CLASE_TH =
  "border-b-2 border-tinta px-2 py-2 text-left font-display text-[11px] font-bold uppercase tracking-[0.12em] text-tinta";
const CLASE_TD = "border-b border-linea px-2 py-2.5 align-top text-sm";

function referencia(renglon: RenglonSurtido): string {
  if (renglon.codigo) return renglon.codigo;
  if (renglon.idPiezaUsada !== null) return `Usada #${renglon.idPiezaUsada}`;
  return "—";
}

/** Alto de las barras del folio en px; el ancho lo dicta el propio código. */
const ALTO_BARRAS = 48;
/** Lado del QR en px: legible en papel carta sin comerse la cabecera. */
const LADO_QR = 110;

interface Identificadores {
  /** SVG del código de barras del folio; null en borradores o si falló. */
  barras: string | null;
  /** SVG del QR con la liga absoluta al pedido; null si falló. */
  qr: string | null;
  urlPedido: string;
}

async function armarIdentificadores(pedido: HojaSurtido["pedido"]): Promise<Identificadores> {
  const urlPedido = `${urlSitio()}${RUTA_MOSTRADOR}/pedidos/${pedido.id}`;
  // Un borrador no tiene folio: no hay nada que leer con el lector.
  let barras: string | null = null;
  if (pedido.folio) {
    try {
      barras = svgCodigo128(pedido.folio, { alto: ALTO_BARRAS, modulo: 2, conTexto: true });
    } catch (error) {
      console.error("[mostrador] no se pudo dibujar el código de barras del folio", pedido.folio, error);
    }
  }
  let qr: string | null = null;
  try {
    qr = await svgQr(urlPedido, { ancho: LADO_QR });
  } catch (error) {
    console.error("[mostrador] no se pudo dibujar el QR del pedido", pedido.id, error);
  }
  return { barras, qr, urlPedido };
}

/**
 * El número con el que el mostrador ubica al cliente: el id del POS (bdav) si
 * el padrón está ligado, si no el id del padrón; null para público general.
 */
function numeroCliente(pedido: HojaSurtido["pedido"]): { etiqueta: string; numero: number } | null {
  if (typeof pedido.idClienteBdav === "number") return { etiqueta: "N° cliente POS", numero: pedido.idClienteBdav };
  if (typeof pedido.idCliente === "number") return { etiqueta: "Padrón", numero: pedido.idCliente };
  return null;
}

async function Encabezado({ hoja }: { hoja: HojaSurtido }) {
  const { pedido } = hoja;
  const folio = pedido.folio ?? `Borrador #${pedido.id}`;
  const numero = numeroCliente(pedido);
  const { barras, qr, urlPedido } = await armarIdentificadores(pedido);

  // Los SVG entran con dangerouslySetInnerHTML SOLO porque el markup lo genera
  // este mismo servidor (codigo128.ts y qrcode) a partir del folio y de una
  // URL que armamos nosotros: no hay ni un byte del usuario ahí dentro.
  return (
    <header className="border-b-2 border-tinta pb-4">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <MarcaAV lado={44} className="text-tinta" />
          <p className="rotulo-tecnico mt-3 text-xs text-tinta-suave">{NEGOCIO.nombre} · Hoja de pedido</p>
          <h1 className="titulo-lamina num-tab mt-1 text-4xl sm:text-5xl">{folio}</h1>
          <p className="mt-1.5 text-sm text-tinta-suave">
            <span className="num-tab font-mono">{fechaHora(pedido.enviadoEn ?? pedido.creadoEn) || "—"}</span>
            <span className="mx-2" aria-hidden>·</span>
            {ETIQUETA_ESTATUS[pedido.estatus]}
          </p>
          {/* Solo cuando IA ya la levantó: el almacenista la cruza con el POS. */}
          {typeof pedido.numCotizaPos === "number" && (
            <p className="mt-1 text-sm">
              <span className="rotulo-tecnico text-[11px] text-tinta-suave">Cotización POS</span>{" "}
              <span className="num-tab font-mono font-semibold">{pedido.numCotizaPos}</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-start justify-end gap-x-6 gap-y-3">
          {barras && (
            <div
              className="max-w-full overflow-hidden"
              style={{ height: ALTO_BARRAS + 18 }}
              dangerouslySetInnerHTML={{ __html: barras }}
            />
          )}
          {qr && (
            <figure className="m-0 flex flex-col items-center">
              <a
                href={urlPedido}
                className="block"
                style={{ width: LADO_QR, height: LADO_QR }}
                aria-label={`Abrir el pedido ${folio}`}
                dangerouslySetInnerHTML={{ __html: qr }}
              />
              <figcaption className="mt-1.5 max-w-[16ch] text-center text-[11px] leading-snug text-tinta-suave">
                Escanea para ver el pedido
              </figcaption>
            </figure>
          )}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
        {/* El cliente es lo primero que se lee en papel: va grande, con su
            número del POS debajo para cruzarlo sin buscarlo. */}
        <div className="col-span-2 sm:col-span-4">
          <dt className="rotulo-tecnico text-[11px] text-tinta-suave">Cliente</dt>
          <dd>
            <p className="titulo-lamina text-2xl sm:text-3xl">{pedido.cliente}</p>
            {(numero || pedido.telefono) && (
              <p className="mt-1 flex flex-wrap items-baseline gap-x-5 gap-y-1">
                {numero && (
                  <span>
                    <span className="rotulo-tecnico text-[11px] text-tinta-suave">{numero.etiqueta}</span>{" "}
                    <span className="num-tab font-mono text-lg font-bold">{numero.numero}</span>
                  </span>
                )}
                {pedido.telefono && (
                  <span className="num-tab font-mono text-sm text-tinta-suave">{telefonoLegible(pedido.telefono)}</span>
                )}
              </p>
            )}
          </dd>
        </div>
        <div>
          <dt className="rotulo-tecnico text-[11px] text-tinta-suave">Recoge en</dt>
          <dd className="font-semibold">
            {hoja.sucursal.nombre}
            {hoja.trasladar && (
              <span className="sello ml-2 text-anotacion">Trasladar a {hoja.sucursal.nombre}</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="rotulo-tecnico text-[11px] text-tinta-suave">Capturó</dt>
          <dd className="font-mono">{pedido.capturadoPor ?? "cliente"}</dd>
        </div>
        <div>
          <dt className="rotulo-tecnico text-[11px] text-tinta-suave">Pedido</dt>
          <dd className="num-tab font-mono">{fechaHora(pedido.enviadoEn ?? pedido.creadoEn) || "—"}</dd>
        </div>
        <div>
          <dt className="rotulo-tecnico text-[11px] text-tinta-suave">Hoja generada</dt>
          <dd className="num-tab font-mono">{fechaHora(hoja.generadoEn) || "—"}</dd>
        </div>
      </dl>
    </header>
  );
}

function TablaSurtido({ renglones }: { renglones: RenglonSurtido[] }) {
  return (
    <table className="mt-4 w-full border-collapse">
      <thead>
        <tr>
          <th scope="col" className={CLASE_TH}>#</th>
          <th scope="col" className={CLASE_TH}>Origen</th>
          <th scope="col" className={CLASE_TH}>Código / ID usada</th>
          <th scope="col" className={CLASE_TH}>Descripción</th>
          <th scope="col" className={clsx(CLASE_TH, "text-right")}>Cant.</th>
          <th scope="col" className={clsx(CLASE_TH, "text-right")}>Existencia</th>
          <th scope="col" className={CLASE_TH}>Ubicación</th>
          <th scope="col" className={clsx(CLASE_TH, "text-center")}>Surtido</th>
        </tr>
      </thead>
      <tbody>
        {renglones.map((renglon) => (
          <tr key={renglon.partida}>
            <td className={clsx(CLASE_TD, "num-tab font-mono text-tinta-suave")}>{renglon.partida}</td>
            <td className={clsx(CLASE_TD, "whitespace-nowrap")}>{ETIQUETA_ORIGEN[renglon.origen]}</td>
            <td className={clsx(CLASE_TD, "num-tab whitespace-nowrap font-mono font-semibold")}>{referencia(renglon)}</td>
            <td className={CLASE_TD}>{renglon.descripcion}</td>
            <td className={clsx(CLASE_TD, "num-tab text-right font-mono text-base font-bold")}>{renglon.cantidad}</td>
            <td
              className={clsx(
                CLASE_TD,
                "num-tab text-right font-mono",
                renglon.existenciaActual !== null && renglon.existenciaActual < renglon.cantidad && "font-bold text-anotacion"
              )}
            >
              {renglon.existenciaActual ?? "s/d"}
            </td>
            <td className={clsx(CLASE_TD, "num-tab font-mono")}>{renglon.ubicacionUsada ?? "—"}</td>
            <td className={clsx(CLASE_TD, "text-center")}>
              <span aria-hidden className="inline-block size-5 border-2 border-tinta align-middle" />
              <span className="sr-only">Casilla para marcar surtido</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function PaginaSurtido({ params, searchParams }: Contexto) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const idPedido = idDeRuta(id);
  if (idPedido === null) notFound();
  const imprimirAlCargar = pideImpresion(sp);

  const { hoja, error } = await cargarHoja(idPedido);
  if (error) {
    return (
      <div role="alert" className="lamina mx-auto max-w-md border-anotacion px-5 py-6 text-center">
        <p className="rotulo-tecnico text-xs text-anotacion">No se pudo armar la hoja</p>
        <p className="mt-2 text-sm text-tinta">{error}</p>
        <Link href={`${RUTA_MOSTRADOR}/pedidos/${idPedido}`} className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">
          Volver al pedido
        </Link>
      </div>
    );
  }
  if (!hoja) notFound();

  const rutaPedido = `${RUTA_MOSTRADOR}/pedidos/${hoja.pedido.id}`;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      {imprimirAlCargar && <ImpresionAutomatica />}
      <div className="solo-pantalla flex flex-wrap items-center justify-between gap-3">
        <Link
          href={rutaPedido}
          className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-tinta-suave transition-colors duration-150 hover:text-tinta"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Pedido {hoja.pedido.folio ?? `#${hoja.pedido.id}`}
        </Link>
        <div className="flex items-center gap-2">
          <a
            href={`${rutaPedido}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="solo-pantalla rotulo-tecnico inline-flex h-12 items-center gap-2 rounded-md border border-linea bg-hoja px-4 text-sm text-tinta transition-colors duration-150 hover:border-tinta"
          >
            <FileDown aria-hidden className="size-4" />
            Descargar PDF
          </a>
          <BotonImprimir />
        </div>
      </div>

      <article className="lamina p-6 sm:p-8 print:border-0 print:p-0 print:shadow-none">
        <Encabezado hoja={hoja} />

        {hoja.renglones.length === 0 ? (
          <p className="mt-6 text-sm text-tinta-suave">Este pedido no tiene partidas que surtir.</p>
        ) : (
          <TablaSurtido renglones={hoja.renglones} />
        )}

        <footer className="mt-8 grid gap-6 sm:grid-cols-[1fr_16rem]">
          <div>
            <p className="rotulo-tecnico text-[11px] text-tinta-suave">Observaciones</p>
            <p className={clsx("mt-1 text-sm", !hoja.pedido.observaciones && "text-tinta-suave")}>
              {hoja.pedido.observaciones ?? "Sin observaciones."}
            </p>
            <p className="mt-4 text-xs text-tinta-suave">
              La existencia es la de bdav / Bodega Usado al generar la hoja; &ldquo;s/d&rdquo; = la base no respondió.
            </p>
          </div>
          <div className="self-end">
            <div className="border-b-2 border-tinta pt-10" />
            <p className="rotulo-tecnico mt-1.5 text-[11px] text-tinta-suave">Surtió (nombre y firma)</p>
          </div>
        </footer>
      </article>
    </div>
  );
}
