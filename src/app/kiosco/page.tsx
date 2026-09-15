import type { Metadata } from "next";
import { redirect, unstable_rethrow } from "next/navigation";
import { obtenerBorradorKiosco } from "@/lib/kiosco/datos";
import { RUTA_KIOSCO_ACTIVAR } from "@/lib/kiosco/rutas";
import { sesionClienteKiosco, sesionKiosco } from "@/lib/kiosco/sesion";
import type { PedidoKiosco } from "@/lib/kiosco/tipos";
import { ArmarPedido } from "./ArmarPedido";

// Pantalla de inicio del kiosco: buscar y armar el pedido. La página es de
// servidor y trae de IA el borrador que hubiera quedado vivo (el cliente
// anterior que se fue sin enviar, o el que Vico dejó a medias); si IA no
// responde, se pinta la pantalla igual con el aviso, porque un cliente parado
// frente a una página en blanco se va al mostrador y el kiosco no sirvió de nada.

export const metadata: Metadata = {
  title: "Busca tu pieza",
};

export const dynamic = "force-dynamic";

export default async function PaginaKiosco() {
  const sesion = await sesionKiosco();
  if (!sesion) redirect(RUTA_KIOSCO_ACTIVAR);
  // Si el cliente entró con su celular, Vico lo saluda por su nombre y la
  // tarjeta del pedido dice a nombre de quién va. Solo baja el nombre.
  const cliente = await sesionClienteKiosco();

  let borrador: PedidoKiosco | null = null;
  let errorInicial: string | null = null;
  try {
    borrador = await obtenerBorradorKiosco();
  } catch (error) {
    // `obtenerBorradorKiosco` redirige cuando no hay cookie: ese "error" es de
    // Next y debe seguir su camino, no pintarse como aviso.
    unstable_rethrow(error);
    console.error("[kiosco] no se pudo cargar el borrador del aparato", error);
    errorInicial =
      error instanceof Error && error.message
        ? error.message
        : "No pude leer tu pedido; empieza a buscar y lo intento de nuevo";
  }

  return (
    <ArmarPedido
      borradorInicial={borrador}
      errorInicial={errorInicial}
      sucursal={sesion.sucursal}
      nombreCliente={cliente?.nombre ?? null}
    />
  );
}
