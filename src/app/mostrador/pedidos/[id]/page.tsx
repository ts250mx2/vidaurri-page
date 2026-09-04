import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect, unstable_rethrow } from "next/navigation";
import { ChevronLeft, FileDown, Printer } from "lucide-react";
import clsx from "clsx";
import { CancelarPedido } from "@/components/mostrador/CancelarPedido";
import { pesos } from "@/lib/formato";
import { obtenerPedido } from "@/lib/mostrador/datos";
import {
  ETIQUETA_CANAL,
  ETIQUETA_SUCURSAL,
  etiquetaEvento,
  fechaHora,
  motivoNoEditable,
  telefonoLegible,
} from "@/lib/mostrador/etiquetas";
import { idDeRuta } from "@/lib/mostrador/reenvio";
import {
  CLASE_SELLO_ESTATUS,
  ETIQUETA_ESTATUS,
  partidasParaBackorder,
  puedeCambiarEstatus,
  puedeEditarPedido,
} from "@/lib/mostrador/reglas";
import { sesionMostrador } from "@/lib/mostrador/sesion";
import type { EventoPedido, PedidoDetalle } from "@/lib/mostrador/tipos";
import { RUTA_LOGIN_MOSTRADOR, RUTA_MOSTRADOR } from "@/lib/mostrador/volver";
import { AccionesPedido } from "./AccionesPedido";
import { BackorderPos } from "./BackorderPos";
import { ConfirmacionPartidas } from "./ConfirmacionPartidas";
import { CotizacionPos } from "./CotizacionPos";
import { EdicionObservaciones, EdicionPartidas, EdicionSucursal } from "./EdicionPedido";
import { TablaPartidas } from "./TablaPartidas";

// Detalle de un pedido para el vendedor. Arriba, la barra de acciones: volver
// a la cola, imprimir la orden (abre la hoja de surtido en otra pestaña y
// lanza el diálogo de impresión), descargar el PDF y, si el perfil puede, el
// bote de cancelar con su diálogo (la misma isla que en la cola). Debajo, la
// cabecera con folio, estatus y datos (incluidas la cotización espejo y la
// back order a Aldo en el POS), partidas, totales con IVA incluido, observaciones, los botones de
// avance de estatus según el perfil (ámbar solo en "Confirmar pedido") y la
// bitácora al pie. Mientras `puedeEditarPedido` (borrador, enviado,
// confirmado) las partidas, la sucursal y las observaciones se editan en las
// islas de `EdicionPedido`; en enviado y confirmado además el mostrador
// confirma la existencia renglón por renglón (`ConfirmacionPartidas`). Ya
// surtido, todo queda en solo lectura con el motivo a la vista. El perfil
// viaja como prop desde el servidor; la verdad sobre lo que se puede hacer la
// impone IA.

export const metadata: Metadata = {
  title: "Pedido · Mostrador",
};

interface Contexto {
  params: Promise<{ id: string }>;
}

interface CargaPedido {
  pedido: PedidoDetalle | null;
  error: string | null;
}

async function cargarPedido(id: number): Promise<CargaPedido> {
  try {
    return { pedido: await obtenerPedido(id), error: null };
  } catch (error) {
    // redirect() a login viaja como excepción de Next: hay que dejarla pasar.
    unstable_rethrow(error);
    console.error("[mostrador] fallo leyendo el pedido", id, error);
    return { pedido: null, error: error instanceof Error ? error.message : "No fue posible leer el pedido" };
  }
}

/** Estatus en los que el mostrador todavía confirma existencia renglón por renglón. */
function admiteConfirmacion(pedido: PedidoDetalle): boolean {
  return pedido.estatus === "enviado" || pedido.estatus === "confirmado";
}

const CLASE_BOTON_BARRA =
  "rotulo-tecnico inline-flex h-12 items-center gap-2 rounded-md border border-linea bg-hoja px-4 text-sm text-tinta transition-colors duration-150 hover:border-tinta";

function Dato({ etiqueta, children, className }: { etiqueta: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="rotulo-tecnico text-[11px] text-tinta-suave">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm text-tinta">{children}</dd>
    </div>
  );
}

function Fechas({ pedido }: { pedido: PedidoDetalle }) {
  const hitos: Array<[string, string | null]> = [
    ["Creado", pedido.creadoEn],
    ["Enviado", pedido.enviadoEn],
    ["Confirmado", pedido.confirmadoEn],
    ["Listo", pedido.listoEn],
    ["Entregado", pedido.entregadoEn],
    ["Cancelado", pedido.canceladoEn],
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
      {hitos
        .filter((hito): hito is [string, string] => hito[1] !== null)
        .map(([etiqueta, valor]) => (
          <Dato key={etiqueta} etiqueta={etiqueta}>
            <span className="num-tab font-mono">{fechaHora(valor) || "—"}</span>
          </Dato>
        ))}
    </dl>
  );
}

function Totales({ pedido }: { pedido: PedidoDetalle }) {
  const filas: Array<[string, number, boolean]> = [
    ["Subtotal", pedido.subtotal, false],
    ["IVA", pedido.iva, false],
    ["Total (IVA incluido)", pedido.total, true],
  ];
  return (
    <dl className="lamina divide-y divide-linea">
      {filas.map(([etiqueta, monto, fuerte]) => (
        <div key={etiqueta} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
          <dt className={clsx("text-sm", fuerte ? "rotulo-tecnico text-tinta" : "text-tinta-suave")}>{etiqueta}</dt>
          <dd className={clsx("num-tab font-mono", fuerte ? "text-xl font-bold" : "text-sm")}>{pesos(monto)}</dd>
        </div>
      ))}
    </dl>
  );
}

function Bitacora({ eventos }: { eventos: EventoPedido[] }) {
  if (eventos.length === 0) {
    return <p className="text-sm text-tinta-suave">Todavía no hay movimientos.</p>;
  }
  // IA los manda en el orden en que ocurrieron; se respeta y se numera.
  return (
    <ol className="lamina divide-y divide-linea">
      {eventos.map((evento) => (
        <li key={evento.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
          <p className="num-tab font-mono text-xs text-tinta-suave">{fechaHora(evento.creadoEn) || "—"}</p>
          <div>
            <p className="text-sm font-semibold text-tinta">
              {etiquetaEvento(evento.evento)}
              {evento.estatusAnterior && evento.estatusNuevo && (
                <span className="ml-2 text-xs font-normal text-tinta-suave">
                  {ETIQUETA_ESTATUS[evento.estatusAnterior]} → {ETIQUETA_ESTATUS[evento.estatusNuevo]}
                </span>
              )}
            </p>
            {evento.detalle && <p className="mt-0.5 text-sm text-tinta-suave">{evento.detalle}</p>}
            <p className="mt-0.5 text-xs text-tinta-suave">
              <span className="font-mono">{evento.usuario ?? "cliente"}</span> · {ETIQUETA_CANAL[evento.canal]}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default async function PaginaPedido({ params }: Contexto) {
  const { id } = await params;
  const idPedido = idDeRuta(id);
  if (idPedido === null) notFound();

  const [sesion, carga] = await Promise.all([sesionMostrador(), cargarPedido(idPedido)]);
  if (!sesion) redirect(RUTA_LOGIN_MOSTRADOR);

  if (carga.error) {
    return (
      <div role="alert" className="lamina mx-auto max-w-md border-anotacion px-5 py-6 text-center">
        <p className="rotulo-tecnico text-xs text-anotacion">No se pudo leer el pedido</p>
        <p className="mt-2 text-sm text-tinta">{carga.error}</p>
        <Link href={RUTA_MOSTRADOR} className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">
          Volver a la cola
        </Link>
      </div>
    );
  }

  const pedido = carga.pedido;
  if (!pedido) notFound();

  const folio = pedido.folio ?? `Borrador #${pedido.id}`;
  const rutaPedido = `${RUTA_MOSTRADOR}/pedidos/${pedido.id}`;
  const conSurtido = pedido.estatus !== "borrador" && pedido.estatus !== "cancelado";
  const editable = puedeEditarPedido(pedido.estatus);
  const motivoBloqueo = motivoNoEditable(pedido.estatus);
  const puedeCancelar = puedeCambiarEstatus(sesion.perfil, pedido.estatus, "cancelado");
  // Campos nuevos del contrato (B5): mientras IA no los mande, la sección no se pinta.
  const conCotizaPos = pedido.cotizaPosEstado !== undefined;
  // Back order a Aldo: se pinta si IA ya manda su estado o si hay renglones
  // sobre pedido (la hoja se imprime aunque el POS no la tenga todavía). En
  // borrador no: sin folio no hay pedido que mandar a Aldo.
  const partidasAldo = partidasParaBackorder(pedido.partidas);
  const conBkoPos = pedido.estatus !== "borrador" && (pedido.bkoPosEstado !== undefined || partidasAldo.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={RUTA_MOSTRADOR}
          className="inline-flex min-h-11 w-fit items-center gap-1 text-sm font-semibold text-tinta-suave transition-colors duration-150 hover:text-tinta"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Pedidos
        </Link>
        {(conSurtido || puedeCancelar) && (
          <div className="flex flex-wrap items-center gap-2">
            {conSurtido && (
              <>
                {/* La hoja de surtido con `?imprimir=1` lanza window.print() al cargar. */}
                <a
                  href={`${rutaPedido}/surtido?imprimir=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={CLASE_BOTON_BARRA}
                >
                  <Printer aria-hidden className="size-4" />
                  Imprimir orden
                </a>
                {/* La hoja en PDF la sirve /pdf (misma cabecera con código de barras y QR). */}
                <a href={`${rutaPedido}/pdf`} target="_blank" rel="noopener noreferrer" className={CLASE_BOTON_BARRA}>
                  <FileDown aria-hidden className="size-4" />
                  Descargar PDF
                </a>
              </>
            )}
            {puedeCancelar && <CancelarPedido idPedido={pedido.id} folio={folio} />}
          </div>
        )}
      </div>

      <header className="lamina p-5 sm:p-6">
        <div>
          <p className="rotulo-tecnico text-xs text-tinta-suave">Pedido · {ETIQUETA_CANAL[pedido.canal]}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="titulo-lamina num-tab text-4xl sm:text-5xl">{folio}</h1>
            <span className={CLASE_SELLO_ESTATUS[pedido.estatus]}>{ETIQUETA_ESTATUS[pedido.estatus]}</span>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-linea pt-5 sm:grid-cols-3 lg:grid-cols-6">
          <Dato etiqueta="Cliente" className="col-span-2">
            <span className="font-semibold">{pedido.cliente}</span>
            {pedido.descuentoPct > 0 && (
              <span className="num-tab ml-2 font-mono text-xs text-tinta-suave">{pedido.descuentoPct}% de descuento</span>
            )}
            {pedido.idCliente === null && <span className="ml-2 text-xs text-tinta-suave">Público general</span>}
          </Dato>
          <Dato etiqueta="Teléfono">
            <span className="num-tab font-mono">{telefonoLegible(pedido.telefono) || "—"}</span>
          </Dato>
          <Dato etiqueta="Recoge en">
            {editable ? (
              <EdicionSucursal idPedido={pedido.id} sucursal={pedido.sucursal} />
            ) : (
              ETIQUETA_SUCURSAL[pedido.sucursal]
            )}
          </Dato>
          <Dato etiqueta="Capturó">
            <span className="font-mono">{pedido.capturadoPor ?? "cliente"}</span>
          </Dato>
          <Dato etiqueta="Atendió">
            <span className="font-mono">{pedido.atendidoPor ?? "—"}</span>
          </Dato>
          {conCotizaPos && (
            <Dato etiqueta="Cotización POS" className="col-span-2">
              <CotizacionPos
                idPedido={pedido.id}
                estatus={pedido.estatus}
                numCotizaPos={pedido.numCotizaPos ?? null}
                estado={pedido.cotizaPosEstado ?? "pendiente"}
                errorPos={pedido.cotizaPosError ?? null}
              />
            </Dato>
          )}
          {conBkoPos && (
            <Dato etiqueta="Back order Aldo" className="col-span-2 sm:col-span-3 lg:col-span-4">
              <BackorderPos
                idPedido={pedido.id}
                estatus={pedido.estatus}
                numBkoPos={pedido.numBkoPos ?? null}
                estado={pedido.bkoPosEstado ?? null}
                errorPos={pedido.bkoPosError ?? null}
                compromiso={pedido.bkoPosCompromiso ?? null}
                conPartidasSobrePedido={partidasAldo.length > 0}
              />
            </Dato>
          )}
        </dl>

        <div className="mt-4 border-t border-linea pt-4">
          <Fechas pedido={pedido} />
        </div>

        {pedido.estatus === "entregado" && pedido.folioVentaPos && (
          <p className="mt-4 text-sm">
            <span className="rotulo-tecnico text-[11px] text-tinta-suave">Venta del POS</span>{" "}
            <span className="num-tab font-mono font-semibold">{pedido.folioVentaPos}</span>
          </p>
        )}
        {pedido.estatus === "cancelado" && (
          <p className="mt-4 text-sm text-anotacion">
            <span className="rotulo-tecnico text-[11px]">Motivo</span>{" "}
            {pedido.motivoCancelacion ?? "Sin motivo registrado"}
          </p>
        )}
      </header>

      <section aria-labelledby="partidas" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="partidas" className="titulo-lamina text-2xl">
            Partidas
          </h2>
          {editable ? (
            <p className="text-sm text-tinta-suave">
              Cambia cantidades, quita piezas o agrega otras; los totales los recalcula el servidor.
            </p>
          ) : (
            motivoBloqueo && <p className="text-sm text-tinta-suave">{motivoBloqueo}</p>
          )}
        </div>
        {editable ? (
          <EdicionPartidas
            idPedido={pedido.id}
            idCliente={pedido.idCliente}
            confirmado={pedido.estatus === "confirmado"}
            partidas={pedido.partidas}
          />
        ) : pedido.partidas.length === 0 ? (
          <div className="lamina px-5 py-8 text-center text-sm text-tinta-suave">Este pedido no tiene partidas.</div>
        ) : (
          <TablaPartidas partidas={pedido.partidas} />
        )}
      </section>

      {admiteConfirmacion(pedido) && pedido.partidas.length > 0 && (
        <section aria-labelledby="confirmacion" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="confirmacion" className="titulo-lamina text-2xl">
              Existencia por renglón
            </h2>
            <p className="text-sm text-tinta-suave">Anota qué encontraste de cada pieza y guarda la confirmación.</p>
          </div>
          {/* Con llave por actualizadoEn: tras cualquier edición vuelve a arrancar con lo que IA dejó. */}
          <ConfirmacionPartidas key={pedido.actualizadoEn} idPedido={pedido.id} partidas={pedido.partidas} />
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section aria-labelledby="observaciones" className="flex flex-col gap-3">
          <h2 id="observaciones" className="titulo-lamina text-2xl">
            Observaciones
          </h2>
          {editable ? (
            <EdicionObservaciones idPedido={pedido.id} observaciones={pedido.observaciones} />
          ) : (
            <p className={clsx("lamina px-4 py-3 text-sm", !pedido.observaciones && "text-tinta-suave")}>
              {pedido.observaciones ?? "Sin observaciones."}
            </p>
          )}
        </section>
        <section aria-label="Totales" className="flex flex-col gap-3">
          <h2 className="titulo-lamina text-2xl">Totales</h2>
          <Totales pedido={pedido} />
        </section>
      </div>

      <section aria-label="Cambiar estatus" className="border-t border-linea pt-5">
        <AccionesPedido idPedido={pedido.id} estatus={pedido.estatus} perfil={sesion.perfil} />
      </section>

      <section aria-labelledby="bitacora" className="flex flex-col gap-3">
        <h2 id="bitacora" className="titulo-lamina text-2xl">
          Bitácora
        </h2>
        <Bitacora eventos={pedido.eventos} />
      </section>
    </div>
  );
}
