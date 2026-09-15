import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { MisPedidos } from "@/app/kiosco/mis-pedidos/MisPedidos";
import { exigirSesionCliente, obtenerPedidosDelCliente } from "@/lib/clientes/datos";
import type { PedidoDeCliente } from "@/lib/kiosco/tipos";

// Los pedidos del cliente: SOLO los suyos (IA los acota por la cabecera que
// sale de la cookie). La misma pantalla del kiosco en su variante de cliente:
// en el celular la lista, y al tocar uno su detalle. La lista se lee en el
// servidor para que aparezca de un golpe; el detalle lo pide la isla por el
// proxy al elegirlo.

export const metadata: Metadata = {
  title: "Mis pedidos",
};

export const dynamic = "force-dynamic";

export default async function PaginaMisPedidosClientes() {
  const sesion = await exigirSesionCliente();

  let pedidos: PedidoDeCliente[] = [];
  let error: string | null = null;
  try {
    pedidos = await obtenerPedidosDelCliente();
  } catch (fallo) {
    unstable_rethrow(fallo);
    console.error("[clientes] no se pudieron leer los pedidos del cliente", fallo);
    // Se dice que falló, no que "no tienes pedidos": no es lo mismo.
    error = fallo instanceof Error && fallo.message ? fallo.message : "No pude leer tus pedidos";
  }

  return <MisPedidos nombre={sesion.nombre} pedidos={pedidos} errorInicial={error} />;
}
