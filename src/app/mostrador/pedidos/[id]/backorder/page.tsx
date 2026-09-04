import type { Metadata } from "next";
import Link from "next/link";
import { notFound, unstable_rethrow } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import clsx from "clsx";
import { identidadCliente } from "@/components/mostrador/Etiquetas";
import { MarcaAV } from "@/components/LogoAV";
import { urlSitio } from "@/config/negocio";
import { fechaCorta, pesos } from "@/lib/formato";
import { svgCodigo128 } from "@/lib/mostrador/codigo128";
import { hojaBackorder } from "@/lib/mostrador/datos";
import { claseSelloBkoPos, etiquetaBkoPos, fechaHora, telefonoLegible } from "@/lib/mostrador/etiquetas";
import { primero } from "@/lib/mostrador/filtros";
import { svgQr } from "@/lib/mostrador/qr";
import { idDeRuta } from "@/lib/mostrador/reenvio";
import type { HojaBackorder, RenglonBackorderHoja } from "@/lib/mostrador/tipos";
import { RUTA_MOSTRADOR } from "@/lib/mostrador/volver";
import { BotonImprimir } from "../surtido/BotonImprimir";
import { ImpresionAutomatica } from "../surtido/ImpresionAutomatica";

// Hoja de back order: la orden de compra que se manda a Aldo Autopartes con
// las partidas sobre pedido del pedido web. Calca la hoja de surtido (misma
// lámina, mismo código de barras y QR, `solo-pantalla` para lo que no va al
// papel) pero CON precios: los renglones van sin IVA, como los guarda el POS
// en detalle_bko, y el IVA se suma una sola vez abajo. El número de back
// order es el del POS (folios_ventas.folio_bko); mientras no exista
// —pendiente, simulada, error— la hoja sale igual con el estado legible en
// vez del número, porque el mostrador la puede necesitar de todos modos.
// Con `?imprimir=1` el diálogo de impresión sale solo al cargar. Sin ámbar:
// aquí no hay nada que tocar, solo papel.

export const metadata: Metadata = {
  title: "Back order · Mostrador",
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
  hoja: HojaBackorder | null;
  error: string | null;
}

async function cargarHoja(id: number): Promise<CargaHoja> {
  try {
    return { hoja: await hojaBackorder(id), error: null };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[mostrador] fallo armando la hoja de back order", id, error);
    return { hoja: null, error: error instanceof Error ? error.message : "No fue posible armar la hoja" };
  }
}

const CLASE_TH =
  "whitespace-nowrap border-b-2 border-tinta px-2 py-2 text-left font-display text-[11px] font-bold uppercase tracking-[0.12em] text-tinta";
const CLASE_TD = "border-b border-linea px-2 py-2.5 align-top text-sm";
const CLASE_ROTULO = "rotulo-tecnico text-[11px] text-tinta-suave";

/** Alto de las barras en px; el ancho lo dicta el propio código. */
const ALTO_BARRAS = 48;
/** Lado del QR en px: legible en papel carta sin comerse la cabecera. */
const LADO_QR = 110;
/** "BKO-71" y no "71" a secas: el lector del POS no lo confunde con un folio de pedido. */
const PREFIJO_BARRAS = "BKO-";
/** Estados cuyo `error` trae algo que leer: el fallo, o el resumen de la simulación. */
const ESTADOS_CON_DETALLE: ReadonlyArray<string> = ["error", "simulada"];

interface Identificadores {
  /** SVG del código de barras del número de back order; null sin número o si falló. */
  barras: string | null;
  /** SVG del QR con la liga absoluta al pedido; null si falló. */
  qr: string | null;
  urlPedido: string;
}

async function armarIdentificadores(hoja: HojaBackorder): Promise<Identificadores> {
  const urlPedido = `${urlSitio()}${RUTA_MOSTRADOR}/pedidos/${hoja.pedido.id}`;
  const { numBko } = hoja.backorder;
  // Sin número en el POS no hay nada que leer con el lector.
  let barras: string | null = null;
  if (numBko !== null) {
    try {
      barras = svgCodigo128(`${PREFIJO_BARRAS}${numBko}`, { alto: ALTO_BARRAS, modulo: 2, conTexto: true });
    } catch (error) {
      console.error("[mostrador] no se pudo dibujar el código de barras de la back order", numBko, error);
    }
  }
  let qr: string | null = null;
  try {
    qr = await svgQr(urlPedido, { ancho: LADO_QR });
  } catch (error) {
    console.error("[mostrador] no se pudo dibujar el QR del pedido", hoja.pedido.id, error);
  }
  return { barras, qr, urlPedido };
}

/** El número con el que el POS ubica al cliente (o el del padrón si no está ligado); null para público general. */
function numeroCliente(pedido: HojaBackorder["pedido"]): { etiqueta: string; numero: number } | null {
  const identidad = identidadCliente(pedido);
  if (identidad.clase === "publico") return null;
  return { etiqueta: identidad.clase === "pos" ? "N° cliente POS" : "Padrón", numero: identidad.id };
}

function Proveedor({ proveedor }: { proveedor: HojaBackorder["proveedor"] }) {
  return (
    <section aria-labelledby="proveedor">
      <h2 id="proveedor" className={CLASE_ROTULO}>
        Proveedor
      </h2>
      {/* El nombre de la casa proveedora es fijo (id 1 de bdav.proveedores);
          lo que se degrada cuando bdav no responde es la dirección y el teléfono. */}
      <p className="titulo-lamina text-2xl sm:text-3xl">{proveedor?.nombre ?? "Aldo Autopartes"}</p>
      {proveedor ? (
        <>
          <p className="mt-1 text-sm">
            {proveedor.direccion}
            {proveedor.ciudad && <span className="text-tinta-suave"> · {proveedor.ciudad}</span>}
          </p>
          {proveedor.telefono && (
            <p className="num-tab mt-0.5 font-mono text-sm text-tinta-suave">{telefonoLegible(proveedor.telefono)}</p>
          )}
        </>
      ) : (
        <p className="mt-1 text-sm text-tinta-suave">Sin dirección ni teléfono: bdav no respondió al generar la hoja.</p>
      )}
    </section>
  );
}

function ParaElPedido({ pedido }: { pedido: HojaBackorder["pedido"] }) {
  const folio = pedido.folio ?? `Borrador #${pedido.id}`;
  const numero = numeroCliente(pedido);
  return (
    <section aria-labelledby="para">
      <h2 id="para" className={CLASE_ROTULO}>
        Para el pedido <span className="num-tab font-mono text-sm normal-case tracking-normal text-tinta">{folio}</span>
      </h2>
      <p className="titulo-lamina text-2xl sm:text-3xl">{pedido.cliente}</p>
      {(numero || pedido.telefono) && (
        <p className="mt-1 flex flex-wrap items-baseline gap-x-5 gap-y-1">
          {numero && (
            <span>
              <span className={CLASE_ROTULO}>{numero.etiqueta}</span>{" "}
              <span className="num-tab font-mono text-lg font-bold">{numero.numero}</span>
            </span>
          )}
          {pedido.telefono && (
            <span className="num-tab font-mono text-sm text-tinta-suave">{telefonoLegible(pedido.telefono)}</span>
          )}
        </p>
      )}
    </section>
  );
}

async function Encabezado({ hoja }: { hoja: HojaBackorder }) {
  const { pedido, backorder } = hoja;
  const conNumero = backorder.numBko !== null;
  const { barras, qr, urlPedido } = await armarIdentificadores(hoja);
  // La fecha de la back order es la del POS; sin ella (todavía no se levantó), la de esta hoja.
  const fecha = fechaCorta(backorder.fechaBko ?? hoja.generadoEn);
  const detalle = ESTADOS_CON_DETALLE.includes(backorder.estado) ? backorder.error : null;

  // Los SVG entran con dangerouslySetInnerHTML SOLO porque el markup lo genera
  // este mismo servidor (codigo128.ts y qrcode) a partir de un número y de una
  // URL que armamos nosotros: no hay ni un byte del usuario ahí dentro.
  return (
    <header className="border-b-2 border-tinta pb-4">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <MarcaAV lado={44} className="text-tinta" />
          <p className="rotulo-tecnico mt-3 text-xs text-tinta-suave">Orden de compra · Aldo Autopartes</p>
          <h1 className="titulo-lamina num-tab mt-1 text-4xl sm:text-5xl">
            Back order{" "}
            {conNumero ? (
              <span className="whitespace-nowrap">N° {backorder.numBko}</span>
            ) : (
              <span className="text-2xl text-tinta-suave sm:text-3xl">· sin número en el POS</span>
            )}
          </h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span>
              <span className={CLASE_ROTULO}>Fecha</span>{" "}
              <span className="num-tab font-mono">{fecha || "—"}</span>
            </span>
            <span>
              <span className={CLASE_ROTULO}>Entrega</span>{" "}
              <span className="font-semibold">{backorder.fechaCompromiso ?? "—"}</span>
            </span>
            {!conNumero && <span className={claseSelloBkoPos(backorder.estado)}>{etiquetaBkoPos(backorder.estado)}</span>}
          </p>
          {/* El porqué del estado es para el mostrador, no para Aldo: solo en pantalla. */}
          {detalle && (
            <p
              className={clsx(
                "solo-pantalla mt-1.5 max-w-prose text-xs",
                backorder.estado === "error" ? "text-anotacion" : "text-tinta-suave"
              )}
            >
              {detalle}
            </p>
          )}
        </div>

        {/* `ml-auto`: si el título largo lo manda a otra línea, sigue pegado a la derecha. */}
        <div className="ml-auto flex flex-wrap items-start justify-end gap-x-6 gap-y-3">
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
                aria-label={`Abrir el pedido ${pedido.folio ?? pedido.id}`}
                dangerouslySetInnerHTML={{ __html: qr }}
              />
              <figcaption className="mt-1.5 max-w-[16ch] text-center text-[11px] leading-snug text-tinta-suave">
                Escanea para ver el pedido
              </figcaption>
            </figure>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-x-8 gap-y-4 border-t border-linea pt-4 sm:grid-cols-2">
        <Proveedor proveedor={hoja.proveedor} />
        <ParaElPedido pedido={pedido} />
      </div>
    </header>
  );
}

function TablaBackorder({ renglones }: { renglones: RenglonBackorderHoja[] }) {
  return (
    <table className="mt-4 w-full border-collapse">
      <thead>
        <tr>
          <th scope="col" className={CLASE_TH}>#</th>
          <th scope="col" className={CLASE_TH}>Código</th>
          <th scope="col" className={CLASE_TH}>Descripción</th>
          <th scope="col" className={clsx(CLASE_TH, "text-right")}>Cant.</th>
          <th scope="col" className={clsx(CLASE_TH, "text-right")}>Días</th>
          <th scope="col" className={clsx(CLASE_TH, "text-right")}>Precio s/IVA</th>
          <th scope="col" className={clsx(CLASE_TH, "text-right")}>Importe</th>
          <th scope="col" className={clsx(CLASE_TH, "text-center")}>Recibido</th>
        </tr>
      </thead>
      <tbody>
        {renglones.map((renglon) => (
          <tr key={renglon.partida}>
            <td className={clsx(CLASE_TD, "num-tab font-mono text-tinta-suave")}>{renglon.partida}</td>
            <td className={clsx(CLASE_TD, "num-tab whitespace-nowrap font-mono font-semibold")}>{renglon.codigo}</td>
            <td className={CLASE_TD}>{renglon.descripcion}</td>
            <td className={clsx(CLASE_TD, "num-tab text-right font-mono text-base font-bold")}>{renglon.cantidad}</td>
            <td className={clsx(CLASE_TD, "num-tab text-right font-mono")}>{renglon.diasEntrega ?? "—"}</td>
            <td className={clsx(CLASE_TD, "num-tab whitespace-nowrap text-right font-mono")}>{pesos(renglon.precioSinIva)}</td>
            <td className={clsx(CLASE_TD, "num-tab whitespace-nowrap text-right font-mono font-semibold")}>
              {pesos(renglon.importeSinIva)}
            </td>
            <td className={clsx(CLASE_TD, "text-center")}>
              <span aria-hidden className="inline-block size-5 border-2 border-tinta align-middle" />
              <span className="sr-only">Casilla para marcar recibido</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Totales({ totales }: { totales: HojaBackorder["totales"] }) {
  // "IVA incluido" solo en el total: los renglones y el subtotal van sin él.
  const filas: Array<[string, number, boolean]> = [
    ["Subtotal (sin IVA)", totales.subtotal, false],
    ["IVA", totales.iva, false],
    ["Total (IVA incluido)", totales.total, true],
  ];
  return (
    <dl className="ml-auto mt-4 w-full max-w-xs">
      {filas.map(([etiqueta, monto, fuerte]) => (
        <div
          key={etiqueta}
          className={clsx(
            "flex items-baseline justify-between gap-4 py-1.5",
            fuerte && "mt-1 border-t-2 border-tinta pt-2.5"
          )}
        >
          <dt className={clsx("text-sm", fuerte ? "rotulo-tecnico text-tinta" : "text-tinta-suave")}>{etiqueta}</dt>
          <dd className={clsx("num-tab font-mono", fuerte ? "text-xl font-bold" : "text-sm")}>{pesos(monto)}</dd>
        </div>
      ))}
    </dl>
  );
}

function Firma({ etiqueta, nombre }: { etiqueta: string; nombre?: string | null }) {
  return (
    <div className="self-end">
      <div className="flex min-h-12 items-end border-b-2 border-tinta">
        {nombre && <span className="pb-1 font-mono text-sm">{nombre}</span>}
      </div>
      <p className={clsx(CLASE_ROTULO, "mt-1.5")}>{etiqueta}</p>
    </div>
  );
}

function Pie({ hoja }: { hoja: HojaBackorder }) {
  const { pedido, backorder } = hoja;
  return (
    <footer className="mt-8 grid gap-6 sm:grid-cols-[1fr_13rem_13rem]">
      <div>
        <p className={CLASE_ROTULO}>Observaciones del pedido</p>
        <p className={clsx("mt-1 text-sm", !pedido.observaciones && "text-tinta-suave")}>
          {pedido.observaciones ?? "Sin observaciones."}
        </p>
        <p className="mt-4 text-xs text-tinta-suave">
          Precios sin IVA por renglón, como los guarda el POS; el IVA va en el total. Hoja generada el{" "}
          <span className="num-tab font-mono">{fechaHora(hoja.generadoEn) || "—"}</span>.
        </p>
      </div>
      {/* El vendedor del POS que pidió (o pediría) va ya escrito sobre la raya; solo falta la firma. */}
      <Firma etiqueta="Pidió (nombre y firma)" nombre={backorder.vendedor} />
      <Firma etiqueta="Recibió (nombre y firma)" />
    </footer>
  );
}

export default async function PaginaBackorder({ params, searchParams }: Contexto) {
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
  const conRenglones = hoja.renglones.length > 0;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      {/* Sin renglones no hay papel que imprimir: ni diálogo automático ni botón. */}
      {imprimirAlCargar && conRenglones && <ImpresionAutomatica />}
      <div className="solo-pantalla flex flex-wrap items-center justify-between gap-3">
        <Link
          href={rutaPedido}
          className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-tinta-suave transition-colors duration-150 hover:text-tinta"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Pedido {hoja.pedido.folio ?? `#${hoja.pedido.id}`}
        </Link>
        {conRenglones && <BotonImprimir />}
      </div>

      {conRenglones ? (
        <article className="lamina p-6 sm:p-8 print:border-0 print:p-0 print:shadow-none">
          <Encabezado hoja={hoja} />
          <TablaBackorder renglones={hoja.renglones} />
          <Totales totales={hoja.totales} />
          <Pie hoja={hoja} />
        </article>
      ) : (
        <div className="lamina mx-auto w-full max-w-md px-5 py-6 text-center">
          <p className="rotulo-tecnico text-xs text-tinta-suave">Back order · Aldo Autopartes</p>
          <p className="mt-2 text-sm text-tinta">Este pedido no tiene partidas sobre pedido.</p>
          <Link href={rutaPedido} className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">
            Volver al pedido
          </Link>
        </div>
      )}
    </div>
  );
}
