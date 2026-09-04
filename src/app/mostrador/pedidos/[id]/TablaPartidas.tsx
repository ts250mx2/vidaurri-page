import clsx from "clsx";
import { pesos } from "@/lib/formato";
import { CLASE_SELLO_PARTIDA, ETIQUETA_ESTATUS_PARTIDA, ETIQUETA_ORIGEN } from "@/lib/mostrador/etiquetas";
import type { PartidaPedido } from "@/lib/mostrador/tipos";

// Partidas del pedido en solo lectura (pedidos listos, entregados o
// cancelados: ya no se editan). Mientras el pedido es editable la tabla la
// pinta `EdicionPartidas` (EdicionPedido.tsx) y la confirmación por renglón
// `ConfirmacionPartidas`, ambas de cliente; esta no lleva JavaScript.

export const CLASE_TH_PARTIDA =
  "whitespace-nowrap px-3 py-2.5 text-left font-display text-[11px] font-bold uppercase tracking-[0.12em] text-tinta-suave";
export const CLASE_TD_PARTIDA = "px-3 py-2.5 align-top";

/** Código de bdav o, en usadas, el ID de la pieza en la Bodega. */
export function referenciaPartida(partida: Pick<PartidaPedido, "codigo" | "idPiezaUsada">): string {
  if (partida.codigo) return partida.codigo;
  if (partida.idPiezaUsada !== null) return `Usada #${partida.idPiezaUsada}`;
  return "—";
}

export function TablaPartidas({ partidas }: { partidas: PartidaPedido[] }) {
  return (
    <div className="lamina overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse">
        <thead className="bg-papel">
          <tr>
            <th scope="col" className={CLASE_TH_PARTIDA}>#</th>
            <th scope="col" className={CLASE_TH_PARTIDA}>Origen</th>
            <th scope="col" className={CLASE_TH_PARTIDA}>Código</th>
            <th scope="col" className={CLASE_TH_PARTIDA}>Descripción</th>
            <th scope="col" className={clsx(CLASE_TH_PARTIDA, "text-right")}>Cant.</th>
            <th scope="col" className={clsx(CLASE_TH_PARTIDA, "text-right")}>Precio (IVA incluido)</th>
            <th scope="col" className={clsx(CLASE_TH_PARTIDA, "text-right")}>Importe (IVA incluido)</th>
            <th scope="col" className={CLASE_TH_PARTIDA}>Existencia</th>
          </tr>
        </thead>
        <tbody>
          {partidas.map((partida) => (
            <tr key={partida.id} className="border-t border-linea">
              <td className={clsx(CLASE_TD_PARTIDA, "num-tab font-mono text-sm text-tinta-suave")}>{partida.partida}</td>
              <td className={clsx(CLASE_TD_PARTIDA, "whitespace-nowrap text-sm")}>{ETIQUETA_ORIGEN[partida.origen]}</td>
              <td className={clsx(CLASE_TD_PARTIDA, "num-tab whitespace-nowrap font-mono text-sm font-semibold")}>
                {referenciaPartida(partida)}
              </td>
              <td className={clsx(CLASE_TD_PARTIDA, "text-sm")}>
                {partida.descripcion}
                {partida.nota && <p className="mt-1 text-xs text-tinta-suave">Nota: {partida.nota}</p>}
              </td>
              <td className={clsx(CLASE_TD_PARTIDA, "num-tab text-right font-mono text-sm")}>{partida.cantidad}</td>
              <td className={clsx(CLASE_TD_PARTIDA, "num-tab whitespace-nowrap text-right font-mono text-sm")}>
                {pesos(partida.precioUnitario)}
              </td>
              <td className={clsx(CLASE_TD_PARTIDA, "num-tab whitespace-nowrap text-right font-mono text-sm font-semibold")}>
                {pesos(partida.importe)}
              </td>
              <td className={clsx(CLASE_TD_PARTIDA, "whitespace-nowrap")}>
                <span className={CLASE_SELLO_PARTIDA[partida.estatusPartida]}>
                  {ETIQUETA_ESTATUS_PARTIDA[partida.estatusPartida]}
                  {partida.estatusPartida === "sobre_pedido" && partida.diasEntrega !== null && ` · ${partida.diasEntrega} d`}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
