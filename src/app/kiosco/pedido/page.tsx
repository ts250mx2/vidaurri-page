import type { Metadata } from "next";
import { redirect, unstable_rethrow } from "next/navigation";
import { pesos } from "@/lib/formato";
import { obtenerBorradorKiosco } from "@/lib/kiosco/datos";
import { nombreSucursal } from "@/lib/kiosco/identidad";
import { RUTA_KIOSCO, RUTA_KIOSCO_ACTIVAR } from "@/lib/kiosco/rutas";
import { sesionKiosco } from "@/lib/kiosco/sesion";
import type { PedidoKiosco } from "@/lib/kiosco/tipos";
import { DatosCliente } from "./DatosCliente";

// Paso 2: el cliente ve lo que lleva y deja su nombre y su celular. El resumen
// se relee de IA en el servidor (no viaja en la URL ni en el navegador): así
// lo que confirma es exactamente lo que el mostrador va a recibir.
//
// Sin piezas no hay nada que enviar y se regresa al inicio: un formulario que
// manda un pedido vacío es un callejón sin salida disfrazado.

export const metadata: Metadata = {
  title: "Tus datos",
};

export const dynamic = "force-dynamic";

export default async function PaginaDatosKiosco() {
  const sesion = await sesionKiosco();
  if (!sesion) redirect(RUTA_KIOSCO_ACTIVAR);

  let pedido: PedidoKiosco | null = null;
  try {
    pedido = await obtenerBorradorKiosco();
  } catch (error) {
    unstable_rethrow(error);
    console.error("[kiosco] no se pudo leer el borrador para pedir los datos", error);
    // Sin resumen no se puede confirmar nada con honestidad: de vuelta al
    // inicio, donde la pantalla sí sabe avisar y el cliente puede reintentar.
    redirect(RUTA_KIOSCO);
  }
  if (!pedido || pedido.partidas.length === 0) redirect(RUTA_KIOSCO);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-12 lg:items-start">
      <section aria-label="Tus datos" className="lg:col-span-7">
        <DatosCliente />
      </section>

      <section aria-label="Resumen de tu pedido" className="lamina p-6 lg:col-span-5">
        <p className="rotulo-tecnico text-sm text-tinta-suave">Lo que vas a pedir</p>
        <p className="mt-1 text-sm text-tinta-suave">
          Lo recoges en {nombreSucursal(sesion.sucursal)}
        </p>

        <ul className="mt-4 flex flex-col divide-y divide-linea border-y border-linea">
          {pedido.partidas.map((partida) => (
            <li key={partida.idPartida} className="flex items-start gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold leading-snug text-tinta">
                  {partida.descripcion}
                </p>
                <p className="num-tab mt-0.5 font-mono text-xs text-tinta-suave">
                  {partida.codigo ?? (partida.idPiezaUsada !== null ? `Usada #${partida.idPiezaUsada}` : "")}
                  {" · "}
                  {partida.cantidad} × {pesos(partida.precioConIva)}
                </p>
                {!partida.hayEnTienda && (
                  <span className="sello mt-1.5 text-plano">Sobre pedido</span>
                )}
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
          El mostrador confirma la existencia de cada pieza antes de cobrarte. Si algo no está en
          tienda, te lo decimos al entregarte el folio.
        </p>
      </section>
    </div>
  );
}
