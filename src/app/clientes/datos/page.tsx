import type { Metadata } from "next";
import { redirect, unstable_rethrow } from "next/navigation";
import { ResumenPedido } from "@/components/kiosco/ResumenPedido";
import { exigirSesionCliente, obtenerBorradorCliente } from "@/lib/clientes/datos";
import { RUTA_CLIENTES_PEDIDO } from "@/lib/clientes/rutas";
import type { PedidoKiosco } from "@/lib/kiosco/tipos";
import { DatosEnvio } from "./DatosEnvio";

// Paso 2 del área de clientes: el pedido ya va a su nombre, así que lo único
// que falta es dónde lo recoge (Matriz o Sucursal Fierro) y, si quiere, una
// nota. El resumen se relee de IA en el servidor para que lo que confirma sea
// exactamente lo que el mostrador va a recibir. Sin piezas no hay nada que
// enviar y se regresa a armar.

export const metadata: Metadata = {
  title: "Sucursal",
};

export const dynamic = "force-dynamic";

const NOTA_RESUMEN =
  "El mostrador confirma la existencia de cada pieza y te avisa por WhatsApp. Pagas al recoger; si algo hay que pedirlo, te decimos cuánto tarda.";

export default async function PaginaDatosClientes() {
  const sesion = await exigirSesionCliente();

  let pedido: PedidoKiosco | null = null;
  try {
    pedido = await obtenerBorradorCliente();
  } catch (error) {
    unstable_rethrow(error);
    console.error("[clientes] no se pudo leer el borrador para elegir sucursal", error);
    // Sin resumen no se puede confirmar nada con honestidad: de vuelta a
    // armar, donde la pantalla sí sabe avisar y el cliente puede reintentar.
    redirect(RUTA_CLIENTES_PEDIDO);
  }
  if (!pedido || pedido.partidas.length === 0) redirect(RUTA_CLIENTES_PEDIDO);

  return (
    <DatosEnvio
      permitirPedido={sesion.permitirPedido}
      resumen={<ResumenPedido pedido={pedido} sucursal={null} nota={NOTA_RESUMEN} />}
    />
  );
}
