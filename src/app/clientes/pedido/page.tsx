import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { ArmarPedido } from "@/app/kiosco/ArmarPedido";
import { exigirSesionCliente, obtenerBorradorCliente } from "@/lib/clientes/datos";
import type { PedidoKiosco } from "@/lib/kiosco/tipos";

// Armar el pedido en el área de clientes: la misma pantalla del kiosco, en su
// variante de cliente (contexto de área): las llamadas van a /api/clientes/*,
// la sucursal se elige al final y no hay atajos de teclado. La página es de
// servidor y trae de IA el borrador vivo del cliente (el mismo que arma por
// WhatsApp); si IA no responde, se pinta igual con el aviso.

export const metadata: Metadata = {
  title: "Arma tu pedido",
};

export const dynamic = "force-dynamic";

export default async function PaginaPedidoClientes() {
  const sesion = await exigirSesionCliente();

  let borrador: PedidoKiosco | null = null;
  let errorInicial: string | null = null;
  try {
    borrador = await obtenerBorradorCliente();
  } catch (error) {
    // `exigirSesionCliente` redirige cuando no hay cookie: ese "error" es de
    // Next y debe seguir su camino, no pintarse como aviso.
    unstable_rethrow(error);
    console.error("[clientes] no se pudo cargar el borrador del cliente", error);
    errorInicial =
      error instanceof Error && error.message
        ? error.message
        : "No pude leer tu pedido; empieza a buscar y lo intento de nuevo";
  }

  return (
    <ArmarPedido
      borradorInicial={borrador}
      errorInicial={errorInicial}
      sucursal={null}
      nombreCliente={sesion.nombre}
    />
  );
}
