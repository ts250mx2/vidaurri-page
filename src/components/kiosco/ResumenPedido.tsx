import { pesos } from "@/lib/formato";
import { nombreSucursal } from "@/lib/kiosco/identidad";
import type { PedidoKiosco } from "@/lib/kiosco/tipos";
import type { SucursalEntrega } from "@/lib/mostrador/tipos";

// "Lo que vas a pedir": el resumen que acompaña al paso 2 en el kiosco (Tus
// datos) y en el área de clientes (Sucursal). Se pinta en el servidor con el
// borrador releído de IA, para que lo que el cliente confirma sea exactamente
// lo que el mostrador va a recibir. Sin estado ni acciones: solo lo pinta.

export function ResumenPedido({
  pedido,
  sucursal,
  nota,
}: {
  pedido: PedidoKiosco;
  /** Sucursal ya fijada (kiosco); null cuando se elige en el formulario de al lado. */
  sucursal: SucursalEntrega | null;
  nota: string;
}) {
  return (
    <section aria-label="Resumen de tu pedido" className="lamina p-4 sm:p-6">
      <p className="rotulo-tecnico text-sm text-tinta-suave">Lo que vas a pedir</p>
      {sucursal && (
        <p className="mt-1 text-sm text-tinta-suave">Lo recoges en {nombreSucursal(sucursal)}</p>
      )}

      <ul className="mt-4 flex flex-col divide-y divide-linea border-y border-linea">
        {pedido.partidas.map((partida) => (
          <li key={partida.idPartida} className="flex items-start gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold leading-snug text-tinta">{partida.descripcion}</p>
              <p className="num-tab mt-0.5 font-mono text-xs text-tinta-suave">
                {partida.codigo ?? (partida.idPiezaUsada !== null ? `Usada #${partida.idPiezaUsada}` : "")}
                {" · "}
                {partida.cantidad} × {pesos(partida.precioConIva)}
              </p>
              {!partida.hayEnTienda && <span className="sello mt-1.5 text-plano">Sobre pedido</span>}
            </div>
            <p className="num-tab shrink-0 font-mono text-base font-semibold text-tinta">
              {pesos(partida.importe)}
            </p>
          </li>
        ))}
      </ul>

      <dl className="num-tab mt-4 grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1 font-mono text-sm">
        <dt className="text-tinta-suave">Piezas</dt>
        <dd className="text-right text-tinta">{pedido.piezas}</dd>
        <dt className="rotulo-tecnico self-center text-sm text-tinta">Total</dt>
        <dd className="titulo-lamina text-right text-3xl text-tinta">{pesos(pedido.total)}</dd>
      </dl>
      <p className="mt-1 text-right text-xs text-tinta-suave">IVA incluido</p>

      <p className="mt-4 rounded-md border border-dashed border-linea-fuerte px-4 py-3 text-sm leading-relaxed text-tinta-suave">
        {nota}
      </p>
    </section>
  );
}
