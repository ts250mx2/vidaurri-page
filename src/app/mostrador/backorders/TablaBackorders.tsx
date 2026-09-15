import type { ReactNode } from "react";
import Link from "next/link";
import { Pencil, Printer } from "lucide-react";
import clsx from "clsx";
import {
  ChipClientePos,
  TONO_ESTATUS,
  esNombreGenerico,
  identidadCliente,
} from "@/components/mostrador/Etiquetas";
import { pesos } from "@/lib/formato";
import {
  claseSelloBkoPos,
  etiquetaBkoPos,
  etiquetaBkoPosCorta,
  fechaHora,
  fechaHoraCorta,
} from "@/lib/mostrador/etiquetas";
import { ETIQUETA_ESTATUS } from "@/lib/mostrador/reglas";
import type { PedidoResumen } from "@/lib/mostrador/tipos";
import { RUTA_MOSTRADOR } from "@/lib/mostrador/volver";

// La lista de back orders a Aldo, con el mismo lenguaje que la cola de
// pedidos (`TablaPedidos`): misma lámina con cabecera grafito, `table-fixed`
// con anchos en porcentaje que suman 100 —así nunca hay scroll horizontal en
// la PC del mostrador, a 1280— y lo que no cabe se trunca con el texto
// completo en el `title`. Seis columnas: la back order (número y estado), el
// pedido del que salió, el cliente, el día en que Aldo entrega, el total del
// pedido y las acciones (imprimir la hoja, abrir el pedido). La barra de
// color de la izquierda es la del ESTATUS DEL PEDIDO, igual que en la cola:
// dice de un vistazo si esa back order es de algo que ya se entregó o de algo
// que sigue esperando. Aquí no hay ámbar: no hay nada que convertir, solo
// papel que imprimir y pedidos que abrir.

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
  { titulo: "Back order", ancho: "w-[19%]" },
  { titulo: "Pedido", ancho: "w-[14%]" },
  { titulo: "Cliente", ancho: "w-[29%]" },
  { titulo: "Entrega", ancho: "w-[11%]", secundaria: true },
  { titulo: "Total del pedido", ancho: "w-[15%]", alDerecha: true },
  { titulo: "Acciones", ancho: "w-[12%]", alDerecha: true, soloLectores: true },
];

const CLASE_TH =
  "whitespace-nowrap px-3 py-2.5 text-left font-display text-[11px] font-bold uppercase tracking-[0.12em] text-white/70";
const CLASE_TD = "border-t border-linea px-3 py-2.5 align-middle";
const CLASE_SECUNDARIA = "hidden lg:table-cell";
const CLASE_FILA =
  "transition-colors duration-150 even:bg-papel/60 hover:bg-linea/40 [&:hover>td]:shadow-[inset_0_1px_0_0_var(--color-linea-fuerte),inset_0_-1px_0_0_var(--color-linea-fuerte)]";
const CLASE_BOTON_ICONO =
  "inline-flex size-10 items-center justify-center rounded-md border border-transparent text-tinta-suave transition-colors duration-150 hover:border-tinta hover:bg-hoja hover:text-tinta";

function CeldaBackorder({ pedido }: { pedido: PedidoResumen }) {
  const numBko = pedido.numBkoPos ?? null;
  const estado = pedido.bkoPosEstado;
  // El fallo del POS es lo que hay que leer en esta pantalla: es la razón de
  // que la pieza no esté pedida todavía. Completo en el title.
  const fallo = estado === "error" ? pedido.bkoPosError : null;
  return (
    <td
      className={clsx(CLASE_TD, "border-l-[3px]", TONO_ESTATUS[pedido.estatus].barra)}
      title={`Pedido ${ETIQUETA_ESTATUS[pedido.estatus].toLowerCase()}`}
    >
      <p className="num-tab truncate font-mono text-sm font-bold text-tinta">
        {numBko !== null ? `N° ${numBko}` : <span className="font-medium text-tinta-suave">Sin número</span>}
      </p>
      {estado && (
        <p className="mt-1 flex">
          {/* El sello es inline-flex: no se trunca con elipsis. Por eso aquí
              va la etiqueta corta y la larga se queda en el title. */}
          <span className={clsx(claseSelloBkoPos(estado), "max-w-full whitespace-nowrap")} title={etiquetaBkoPos(estado)}>
            {etiquetaBkoPosCorta(estado)}
          </span>
        </p>
      )}
      {fallo && (
        <p className="mt-0.5 truncate text-[11px] font-medium text-anotacion" title={fallo}>
          {fallo}
        </p>
      )}
    </td>
  );
}

function CeldaPedido({ pedido, detalle, folio }: { pedido: PedidoResumen; detalle: string; folio: string }) {
  const creado = fechaHora(pedido.creadoEn);
  return (
    <td className={CLASE_TD}>
      <Link
        href={detalle}
        className="num-tab block truncate font-mono text-sm font-semibold text-tinta underline-offset-4 hover:underline"
      >
        {folio}
      </Link>
      <p className="num-tab mt-0.5 truncate text-xs text-tinta-suave" title={creado || undefined}>
        {fechaHoraCorta(pedido.creadoEn) || "—"}
      </p>
    </td>
  );
}

function CeldaCliente({ pedido, entrega }: { pedido: PedidoResumen; entrega: string }) {
  // Público general llega con ese mismo texto como nombre: tenue una sola vez.
  const generico = identidadCliente(pedido).clase === "publico" && esNombreGenerico(pedido.cliente);
  return (
    <td className={CLASE_TD}>
      <p
        className={clsx("truncate text-sm", generico ? "font-medium text-tinta-suave" : "font-medium text-tinta")}
        title={pedido.cliente}
      >
        {pedido.cliente}
      </p>
      {!generico && (
        <p className="mt-0.5 flex">
          <ChipClientePos idClienteBdav={pedido.idClienteBdav} idCliente={pedido.idCliente} />
        </p>
      )}
      {/* Bajo `lg` la columna de entrega no se pinta: su dato se apila aquí. */}
      <p className="mt-0.5 truncate text-xs text-tinta-suave lg:hidden">Entrega: {entrega}</p>
    </td>
  );
}

function CeldaEntrega({ entrega }: { entrega: string }) {
  return (
    <td className={clsx(CLASE_TD, CLASE_SECUNDARIA)} title="Día en que entrega Aldo">
      <span className="rotulo-tecnico text-xs text-tinta">{entrega}</span>
    </td>
  );
}

function FilaBackorder({ pedido }: { pedido: PedidoResumen }) {
  const detalle = `${RUTA_MOSTRADOR}/pedidos/${pedido.id}`;
  const folio = pedido.folio ?? `#${pedido.id}`;
  const entrega = pedido.bkoPosCompromiso ?? "—";
  return (
    <tr className={CLASE_FILA}>
      <CeldaBackorder pedido={pedido} />
      <CeldaPedido pedido={pedido} detalle={detalle} folio={folio} />
      <CeldaCliente pedido={pedido} entrega={entrega} />
      <CeldaEntrega entrega={entrega} />
      <td className={clsx(CLASE_TD, "text-right")}>
        <p className="num-tab font-mono text-sm font-bold text-tinta">{pesos(pedido.total)}</p>
        <p className="text-[10px] uppercase tracking-[0.06em] text-tinta-suave">IVA incluido</p>
      </td>
      <td className={clsx(CLASE_TD, "px-2 text-right")}>
        <div className="flex items-center justify-end gap-0.5">
          {/* La hoja en otra pestaña con `?imprimir=1`: el diálogo sale solo y
              la lista se queda donde estaba. */}
          <a
            href={`${detalle}/backorder?imprimir=1`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Imprimir la back order del pedido ${folio}`}
            title="Imprimir back order"
            className={CLASE_BOTON_ICONO}
          >
            <Printer aria-hidden className="size-4" />
          </a>
          <Link
            href={detalle}
            aria-label={`Ver el pedido ${folio}`}
            title="Ver / editar el pedido"
            className={CLASE_BOTON_ICONO}
          >
            <Pencil aria-hidden className="size-4" />
          </Link>
        </div>
      </td>
    </tr>
  );
}

export function TablaBackorders({ pedidos, pie }: { pedidos: PedidoResumen[]; pie?: ReactNode }) {
  return (
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
              <FilaBackorder key={pedido.id} pedido={pedido} />
            ))}
          </tbody>
        </table>
      </div>
      {pie}
    </div>
  );
}
