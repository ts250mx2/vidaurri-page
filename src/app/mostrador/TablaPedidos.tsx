import type { ReactNode } from "react";
import Link from "next/link";
import { Package, Pencil, Phone, Printer, Store } from "lucide-react";
import clsx from "clsx";
import { CancelarPedido } from "@/components/mostrador/CancelarPedido";
import {
  ChipCanal,
  ChipClientePos,
  PildoraEstatus,
  TONO_ESTATUS,
  esNombreGenerico,
  fechaUltimoCambio,
  identidadCliente,
  textoCapturadoPor,
} from "@/components/mostrador/Etiquetas";
import { pesos } from "@/lib/formato";
import {
  ETIQUETA_CANAL,
  ETIQUETA_SUCURSAL,
  ETIQUETA_SUCURSAL_CORTA,
  etiquetaBkoPos,
  etiquetaCotizaPos,
  fechaHora,
  fechaHoraCorta,
  hrefTelefono,
  telefonoLegible,
} from "@/lib/mostrador/etiquetas";
import { puedeCambiarEstatus } from "@/lib/mostrador/reglas";
import type { PedidoResumen, PerfilPos } from "@/lib/mostrador/tipos";
import { RUTA_MOSTRADOR } from "@/lib/mostrador/volver";

// La tabla de la cola de pedidos, pensada para la PC del mostrador (1280-1366
// px de ancho): `table-fixed` con anchos en porcentaje que suman 100, así la
// tabla mide SIEMPRE lo que mide la lámina y nunca aparece scroll horizontal;
// lo que no cabe se trunca y el texto completo queda en el title. Siete
// columnas agrupan lo que antes eran doce: pedido (folio + fecha), cliente
// (nombre + teléfono + identidad en el POS), piezas (+ sucursal), origen
// (canal + quién capturó), total (+ IVA incluido + cotización y back order
// del POS), estatus
// (píldora + fecha del último cambio) y acciones. Bajo `lg` (tablet) se
// esconden piezas y origen y su dato se apila en una línea bajo el cliente.
// Cada renglón lleva a la izquierda una barra con el color de su estatus, que
// es lo que se lee al barrer la cola de arriba abajo. El `pie` (conteo,
// paginación, tamaño de página) va dentro de la misma lámina, bajo la tabla,
// para que se lea como parte de ella y no como otro bloque. Aquí no hay ámbar:
// la única acción ámbar de la pantalla es "Nuevo pedido", arriba.

interface Columna {
  titulo: string;
  /** Porcentaje del ancho de la tabla; entre todas suman 100. */
  ancho: string;
  alDerecha?: boolean;
  /** Se esconde bajo `lg`; su dato se apila en la celda del cliente. */
  secundaria?: boolean;
  /** Título solo para lectores de pantalla (acciones). */
  soloLectores?: boolean;
}

const COLUMNAS: ReadonlyArray<Columna> = [
  { titulo: "Pedido", ancho: "w-[12.5%]" },
  { titulo: "Cliente", ancho: "w-[24.5%]" },
  { titulo: "Piezas", ancho: "w-[10%]", secundaria: true },
  { titulo: "Origen", ancho: "w-[13%]", secundaria: true },
  { titulo: "Total", ancho: "w-[12.5%]", alDerecha: true },
  { titulo: "Estatus", ancho: "w-[15.5%]" },
  { titulo: "Acciones", ancho: "w-[12%]", alDerecha: true, soloLectores: true },
];

const CLASE_TH =
  "whitespace-nowrap px-3 py-2.5 text-left font-display text-[11px] font-bold uppercase tracking-[0.12em] text-white/70";
const CLASE_TD = "border-t border-linea px-3 py-2.5 align-middle";
const CLASE_SECUNDARIA = "hidden lg:table-cell";
/**
 * Cebra suave, hover en línea y un hilo arriba y abajo del renglón tocado (la
 * "sombra" de una tabla). Un pedido NUEVO (`data-nuevo`) va sobre un fondo más
 * oscuro, como el mensaje sin leer de una bandeja: las variantes con
 * `data-[nuevo]` pesan más que `even:` y `hover:` y por eso ganan.
 */
const CLASE_FILA =
  "transition-colors duration-150 even:bg-papel/60 hover:bg-linea/40 data-[nuevo]:bg-plano/[0.07] data-[nuevo]:even:bg-plano/[0.07] data-[nuevo]:hover:bg-plano/[0.12] [&:hover>td]:shadow-[inset_0_1px_0_0_var(--color-linea-fuerte),inset_0_-1px_0_0_var(--color-linea-fuerte)]";

/**
 * "Nuevo" = enviado: ya llegó al mostrador y nadie lo ha confirmado. Es el
 * único estatus que pide atención de alguien; en cuanto Ventas lo confirma
 * deja de resaltar, igual que un mensaje deja de estar en negritas al leerlo.
 */
function esPedidoNuevo(pedido: PedidoResumen): boolean {
  return pedido.estatus === "enviado";
}
const CLASE_LAPIZ =
  "inline-flex size-10 items-center justify-center rounded-md border border-transparent text-tinta-suave transition-colors duration-150 hover:border-tinta hover:bg-hoja hover:text-tinta";
const CLASE_TEL =
  "num-tab inline-flex items-center gap-1 font-mono text-xs text-tinta-suave underline-offset-4 transition-colors duration-150 hover:text-tinta hover:underline";

function CeldaPedido({ pedido, detalle, folio }: { pedido: PedidoResumen; detalle: string; folio: string }) {
  const creado = fechaHora(pedido.creadoEn);
  const nuevo = esPedidoNuevo(pedido);
  return (
    <td className={clsx(CLASE_TD, "border-l-[3px]", TONO_ESTATUS[pedido.estatus].barra)}>
      <p className="flex items-center gap-1.5">
        <Link
          href={detalle}
          className={clsx(
            "num-tab min-w-0 truncate font-mono text-sm text-tinta underline-offset-4 hover:underline",
            nuevo ? "font-extrabold" : "font-semibold"
          )}
        >
          {folio}
        </Link>
        {nuevo && (
          <span className="rotulo-tecnico shrink-0 rounded-sm bg-plano px-1.5 py-0.5 text-[9px] leading-none text-white">
            Nuevo
          </span>
        )}
      </p>
      <p className="num-tab mt-0.5 truncate text-xs text-tinta-suave" title={creado || undefined}>
        {fechaHoraCorta(pedido.creadoEn) || "—"}
      </p>
      {/* El número con el que se busca el pedido en el POS. Va bajo el folio
          porque son los dos identificadores de lo mismo, y así no hay que
          abrirlo para dictárselo al cliente. Solo aparece una vez emitida. */}
      {typeof pedido.numCotizaPos === "number" && (
        <p
          className="num-tab mt-0.5 truncate font-mono text-xs text-tinta-suave"
          title={`Cotización ${pedido.numCotizaPos} en el POS`}
        >
          Cot. {pedido.numCotizaPos}
        </p>
      )}
    </td>
  );
}

function CeldaCliente({ pedido }: { pedido: PedidoResumen }) {
  // Público general llega con ese mismo texto como nombre: se pinta tenue una
  // sola vez en vez de en negritas y otra vez debajo.
  const generico = identidadCliente(pedido).clase === "publico" && esNombreGenerico(pedido.cliente);
  const nuevo = esPedidoNuevo(pedido);
  const tel = hrefTelefono(pedido.telefono);
  const piezas = `${pedido.numPartidas} ${pedido.numPartidas === 1 ? "pieza" : "piezas"}`;
  return (
    <td className={CLASE_TD}>
      <p
        className={clsx(
          "truncate text-sm",
          generico ? "font-medium text-tinta-suave" : "text-tinta",
          !generico && (nuevo ? "font-bold" : "font-medium"),
          generico && nuevo && "font-semibold text-tinta"
        )}
        title={pedido.cliente}
      >
        {pedido.cliente}
      </p>
      {(tel || !generico) && (
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {tel && (
            <a href={tel} className={CLASE_TEL}>
              <Phone aria-hidden className="size-3 shrink-0" />
              {telefonoLegible(pedido.telefono)}
            </a>
          )}
          {!generico && <ChipClientePos idClienteBdav={pedido.idClienteBdav} idCliente={pedido.idCliente} />}
        </p>
      )}
      <p className="mt-0.5 truncate text-xs text-tinta-suave lg:hidden">
        {piezas} · {ETIQUETA_SUCURSAL_CORTA[pedido.sucursal]} · {ETIQUETA_CANAL[pedido.canal]}
      </p>
    </td>
  );
}

function CeldaPiezas({ pedido }: { pedido: PedidoResumen }) {
  const n = pedido.numPartidas;
  return (
    <td className={clsx(CLASE_TD, CLASE_SECUNDARIA)}>
      <p className="flex items-center gap-1.5 text-sm text-tinta" title={`${n} ${n === 1 ? "partida" : "partidas"}`}>
        <Package aria-hidden className="size-3.5 shrink-0 text-tinta-suave" />
        <span className="num-tab font-mono font-semibold">{n}</span>
      </p>
      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-tinta-suave" title={ETIQUETA_SUCURSAL[pedido.sucursal]}>
        <Store aria-hidden className="size-3.5 shrink-0" />
        <span className="truncate">{ETIQUETA_SUCURSAL_CORTA[pedido.sucursal]}</span>
      </p>
    </td>
  );
}

function CeldaOrigen({ pedido }: { pedido: PedidoResumen }) {
  const capturo = textoCapturadoPor(pedido.capturadoPor);
  return (
    <td className={clsx(CLASE_TD, CLASE_SECUNDARIA)}>
      <div className="flex">
        <ChipCanal canal={pedido.canal} />
      </div>
      <p className="mt-1 truncate text-[11px] text-tinta-suave" title={`Capturó: ${capturo}`}>
        Capturó: <span className="font-mono text-tinta">{capturo}</span>
      </p>
    </td>
  );
}

function CeldaTotal({ pedido }: { pedido: PedidoResumen }) {
  const numCotizaPos = pedido.numCotizaPos ?? null;
  const estado = pedido.cotizaPosEstado;
  const conError = numCotizaPos === null && estado === "error";
  const numBkoPos = pedido.numBkoPos ?? null;
  return (
    <td className={clsx(CLASE_TD, "text-right")}>
      <p className="num-tab font-mono text-sm font-bold text-tinta">{pesos(pedido.total)}</p>
      <p className="text-[10px] uppercase tracking-[0.06em] text-tinta-suave">IVA incluido</p>
      {numCotizaPos !== null && (
        <p
          className="num-tab mt-0.5 truncate font-mono text-[11px] text-tinta-suave"
          title={estado ? etiquetaCotizaPos(estado) : undefined}
        >
          Cot. POS #{numCotizaPos}
        </p>
      )}
      {conError && (
        <p className="mt-0.5 truncate text-[11px] font-medium text-anotacion" title={pedido.cotizaPosError ?? undefined}>
          Cot. POS con error
        </p>
      )}
      {numBkoPos !== null && (
        <p
          className="num-tab mt-0.5 truncate font-mono text-[11px] text-tinta-suave"
          title={pedido.bkoPosEstado ? etiquetaBkoPos(pedido.bkoPosEstado) : undefined}
        >
          BKO #{numBkoPos}
        </p>
      )}
    </td>
  );
}

function CeldaEstatus({ pedido }: { pedido: PedidoResumen }) {
  const cambio = fechaUltimoCambio(pedido);
  return (
    <td className={CLASE_TD}>
      <div className="flex">
        <PildoraEstatus estatus={pedido.estatus} corta />
      </div>
      <p className="num-tab mt-1 truncate text-[11px] text-tinta-suave" title={fechaHora(cambio) || undefined}>
        {fechaHoraCorta(cambio) || "—"}
      </p>
    </td>
  );
}

function FilaPedido({ pedido, perfil }: { pedido: PedidoResumen; perfil: PerfilPos }) {
  const detalle = `${RUTA_MOSTRADOR}/pedidos/${pedido.id}`;
  const folio = pedido.folio ?? `#${pedido.id}`;
  const puedeCancelar = puedeCambiarEstatus(perfil, pedido.estatus, "cancelado");
  return (
    <tr className={CLASE_FILA} data-nuevo={esPedidoNuevo(pedido) ? "" : undefined}>
      <CeldaPedido pedido={pedido} detalle={detalle} folio={folio} />
      <CeldaCliente pedido={pedido} />
      <CeldaPiezas pedido={pedido} />
      <CeldaOrigen pedido={pedido} />
      <CeldaTotal pedido={pedido} />
      <CeldaEstatus pedido={pedido} />
      <td className={clsx(CLASE_TD, "px-2 text-right")}>
        <div className="flex items-center justify-end gap-0.5">
          {/* Abre la hoja en otra pestaña con `?imprimir=1`: el diálogo de
              impresión sale solo y la cola se queda donde estaba. */}
          <a
            href={`${detalle}/surtido?imprimir=1`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Imprimir ${folio}`}
            title="Imprimir orden"
            className={CLASE_LAPIZ}
          >
            <Printer aria-hidden className="size-4" />
          </a>
          <Link href={detalle} aria-label="Ver / editar" title="Ver / editar" className={CLASE_LAPIZ}>
            <Pencil aria-hidden className="size-4" />
          </Link>
          {puedeCancelar && <CancelarPedido idPedido={pedido.id} folio={folio} compacto />}
        </div>
      </td>
    </tr>
  );
}

export function TablaPedidos({
  pedidos,
  perfil,
  pie,
}: {
  pedidos: PedidoResumen[];
  perfil: PerfilPos;
  /** Pie dentro de la lámina, bajo la tabla (conteo, paginación, tamaño de página). */
  pie?: ReactNode;
}) {
  return (
    // overflow-hidden en la lámina para que la cabecera grafito y el pie
    // respeten la esquina redondeada; el overflow-x-auto interior es solo red
    // de seguridad: con table-fixed y anchos que suman 100 % la tabla nunca es
    // más ancha que la lámina.
    <div className="lamina overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-separate border-spacing-0 text-tinta">
          <thead className="bg-plano-hondo">
            <tr>
              {COLUMNAS.map((columna, indice) => (
                <th
                  key={columna.titulo}
                  scope="col"
                  className={clsx(
                    CLASE_TH,
                    columna.ancho,
                    // Misma barra que los renglones, transparente, para que el título quede alineado.
                    indice === 0 && "border-l-[3px] border-l-transparent",
                    columna.secundaria && CLASE_SECUNDARIA,
                    columna.alDerecha && "text-right"
                  )}
                >
                  {columna.soloLectores ? <span className="sr-only">{columna.titulo}</span> : columna.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pedidos.map((pedido) => (
              <FilaPedido key={pedido.id} pedido={pedido} perfil={perfil} />
            ))}
          </tbody>
        </table>
      </div>
      {pie}
    </div>
  );
}
