import type { Metadata } from "next";
import { redirect, unstable_rethrow } from "next/navigation";
import { ResumenPedido } from "@/components/kiosco/ResumenPedido";
import { obtenerBorradorKiosco } from "@/lib/kiosco/datos";
import { RUTA_KIOSCO, RUTA_KIOSCO_ACTIVAR } from "@/lib/kiosco/rutas";
import { sesionClienteKiosco, sesionKiosco } from "@/lib/kiosco/sesion";
import type { PedidoKiosco } from "@/lib/kiosco/tipos";
import { DatosCliente } from "./DatosCliente";

// Paso 2: el cliente ve lo que lleva y deja su nombre y su celular; si entró
// con su celular, esos datos ya son los del padrón y solo confirma. El resumen
// se relee de IA en el servidor (no viaja en la URL ni en el navegador): así
// lo que confirma es exactamente lo que el mostrador va a recibir.
//
// Sin piezas no hay nada que enviar y se regresa al inicio: un formulario que
// manda un pedido vacío es un callejón sin salida disfrazado.

export const metadata: Metadata = {
  title: "Tus datos",
};

export const dynamic = "force-dynamic";

const NOTA_RESUMEN =
  "El mostrador confirma la existencia de cada pieza antes de cobrarte. Si algo no está en tienda, te lo decimos al entregarte el folio.";

export default async function PaginaDatosKiosco() {
  const sesion = await sesionKiosco();
  if (!sesion) redirect(RUTA_KIOSCO_ACTIVAR);
  const cliente = await sesionClienteKiosco();

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
        <DatosCliente
          cliente={cliente ? { nombre: cliente.nombre, telefono: cliente.telefono } : null}
        />
      </section>

      <div className="lg:col-span-5">
        <ResumenPedido pedido={pedido} sucursal={sesion.sucursal} nota={NOTA_RESUMEN} />
      </div>
    </div>
  );
}
