import { ArrowLeft } from "lucide-react";
import { CLASE_ERROR_KIOSCO, CLASE_ETIQUETA_KIOSCO } from "@/components/kiosco/estilos";
import { pesos } from "@/lib/formato";
import {
  CLASE_SELLO_ESTATUS_CLIENTE,
  claseSelloPartidaCliente,
  ETIQUETA_ESTATUS_CLIENTE,
  etiquetaPartidaCliente,
} from "@/lib/kiosco/estatus";
import { nombreSucursal } from "@/lib/kiosco/identidad";
import type { DetallePedidoDeCliente } from "@/lib/kiosco/tipos";
import { fechaHora } from "@/lib/mostrador/etiquetas";

// El pedido que el cliente eligió: folio grande, cómo va, cuándo y dónde, los
// renglones con su estado y el total con IVA. Sin estado propio: la isla de
// la lista decide qué se pinta y esto solo lo pinta. En el celular lleva
// arriba "Todos mis pedidos" para volver a la lista (`onVolver`).

/** Qué sigue para el cliente según el estatus; una frase, sin promesas de plazo. */
const QUE_SIGUE: Readonly<Record<DetallePedidoDeCliente["estatus"], string>> = {
  borrador: "Este pedido no llegó a enviarse.",
  enviado: "El mostrador lo va a revisar y te avisa por WhatsApp o teléfono.",
  confirmado: "Ya lo estamos surtiendo; te avisamos en cuanto esté listo.",
  listo: "Pásalo a recoger con este folio en la sucursal.",
  entregado: "Ya te lo entregamos. Gracias por tu compra.",
  cancelado: "Este pedido se canceló. Si fue un error, dilo en el mostrador.",
};

export function DetallePedido({
  folio,
  detalle,
  cargando,
  error,
  onVolver,
}: {
  folio: string | null;
  detalle: DetallePedidoDeCliente | null;
  cargando: boolean;
  error: string | null;
  /** Móvil: regresar a la lista. En pantalla grande la lista ya está al lado. */
  onVolver?: () => void;
}) {
  if (!folio) {
    return (
      <div className="lamina px-8 py-14 text-center">
        <p className="text-lg text-tinta-suave">Elige un pedido de la lista para ver sus piezas.</p>
      </div>
    );
  }

  const mostrado = detalle?.folio === folio ? detalle : null;

  return (
    <div className="lamina overflow-hidden">
      {onVolver && (
        <button
          type="button"
          onClick={onVolver}
          className="flex h-11 w-full items-center gap-2 border-b border-linea px-4 text-sm font-semibold text-tinta transition-colors duration-150 hover:bg-papel lg:hidden"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Todos mis pedidos
        </button>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-linea bg-hoja px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
        <div>
          <p className={CLASE_ETIQUETA_KIOSCO}>Folio</p>
          <p className="num-tab mt-1 font-mono text-3xl font-bold tracking-tight text-tinta sm:text-4xl">{folio}</p>
        </div>
        {mostrado && (
          <div className="sm:text-right">
            <span className={CLASE_SELLO_ESTATUS_CLIENTE[mostrado.estatus]}>
              {ETIQUETA_ESTATUS_CLIENTE[mostrado.estatus]}
            </span>
            <p className="mt-2 text-sm text-tinta-suave">
              {fechaHora(mostrado.enviadoEn ?? mostrado.creadoEn) || "Sin fecha"}
              {mostrado.sucursal && ` · ${nombreSucursal(mostrado.sucursal)}`}
            </p>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className={`${CLASE_ERROR_KIOSCO} m-4 sm:m-6`}>
          {error}
        </p>
      )}

      {cargando && !mostrado && !error && (
        <p className="px-6 py-10 text-center text-base text-tinta-suave">Leyendo tu pedido…</p>
      )}

      {mostrado && (
        <div>
          <p className="border-b border-linea px-4 py-3 text-base leading-relaxed text-tinta sm:px-6">
            {QUE_SIGUE[mostrado.estatus]}
          </p>

          <ul className="divide-y divide-linea px-4 sm:px-6">
            {mostrado.partidas.map((partida, i) => (
              <li key={`${partida.codigo ?? "s"}-${i}`} className="flex items-start gap-3 py-3.5 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold leading-snug text-tinta">{partida.descripcion}</p>
                  <p className="num-tab mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-sm text-tinta-suave">
                    {partida.codigo && <span>{partida.codigo}</span>}
                    <span>
                      {partida.cantidad} × {pesos(partida.precioUnitario)}
                    </span>
                    <span className={claseSelloPartidaCliente(partida.estatusPartida)}>
                      {etiquetaPartidaCliente(partida.estatusPartida)}
                    </span>
                  </p>
                </div>
                <p className="num-tab shrink-0 font-mono text-base font-semibold text-tinta">
                  {pesos(partida.importe)}
                </p>
              </li>
            ))}
            {mostrado.partidas.length === 0 && (
              <li className="py-6 text-center text-base text-tinta-suave">Este pedido no trae renglones.</li>
            )}
          </ul>

          {mostrado.observaciones && (
            <p className="mx-4 mb-2 rounded-md border border-dashed border-linea-fuerte px-4 py-3 text-sm leading-relaxed text-tinta-suave sm:mx-6">
              <span className="rotulo-tecnico mr-2 text-xs text-tinta">Nota</span>
              {mostrado.observaciones}
            </p>
          )}

          <dl className="num-tab grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1 border-t border-linea bg-hoja px-4 py-4 font-mono text-sm sm:px-6">
            <dt className="text-tinta-suave">Piezas</dt>
            <dd className="text-right text-tinta">{mostrado.piezas}</dd>
            <dt className="rotulo-tecnico self-center text-sm text-tinta">Total</dt>
            <dd className="titulo-lamina text-right text-3xl text-tinta">{pesos(mostrado.total)}</dd>
            <dd className="col-span-2 text-right font-sans text-xs text-tinta-suave">IVA incluido</dd>
          </dl>
        </div>
      )}
    </div>
  );
}
