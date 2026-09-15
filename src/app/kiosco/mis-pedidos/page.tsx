import type { Metadata } from "next";
import { redirect, unstable_rethrow } from "next/navigation";
import { obtenerPedidosDeCliente } from "@/lib/kiosco/datos";
import { RUTA_KIOSCO_ACTIVAR, RUTA_KIOSCO_ENTRAR } from "@/lib/kiosco/rutas";
import { sesionClienteKiosco, sesionKiosco } from "@/lib/kiosco/sesion";
import type { PedidoDeCliente } from "@/lib/kiosco/tipos";
import { MisPedidos } from "./MisPedidos";

// Los pedidos del cliente que entró con su celular: SOLO los suyos (IA los
// acota por la cabecera que sale de la cookie) y nada que apunte fuera del
// kiosco. La lista se lee en el servidor para que aparezca de un golpe; el
// detalle de cada uno lo pide la isla por el proxy al elegirlo.
//
// Sin sesión de cliente no hay lista que enseñar: a entrar.

export const metadata: Metadata = {
  title: "Mis pedidos",
};

export const dynamic = "force-dynamic";

export default async function PaginaMisPedidos() {
  const sesion = await sesionKiosco();
  if (!sesion) redirect(RUTA_KIOSCO_ACTIVAR);
  const cliente = await sesionClienteKiosco();
  if (!cliente) redirect(RUTA_KIOSCO_ENTRAR);

  let pedidos: PedidoDeCliente[] = [];
  let error: string | null = null;
  try {
    pedidos = await obtenerPedidosDeCliente();
  } catch (fallo) {
    unstable_rethrow(fallo);
    console.error("[kiosco] no se pudieron leer los pedidos del cliente", fallo);
    // Se dice que falló, no que "no tienes pedidos": no es lo mismo.
    error = fallo instanceof Error && fallo.message ? fallo.message : "No pude leer tus pedidos";
  }

  return <MisPedidos nombre={cliente.nombre} pedidos={pedidos} errorInicial={error} />;
}
