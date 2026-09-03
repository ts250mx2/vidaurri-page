import type { Metadata } from "next";
import { redirect, unstable_rethrow } from "next/navigation";
import { obtenerBorrador } from "@/lib/mostrador/datos";
import { sesionMostrador } from "@/lib/mostrador/sesion";
import type { PedidoDetalle } from "@/lib/mostrador/tipos";
import { RUTA_LOGIN_MOSTRADOR } from "@/lib/mostrador/volver";
import { NuevoPedido } from "./NuevoPedido";

// Captura de un pedido nuevo. La página es de servidor: carga el borrador que
// el vendedor dejó a medias (si lo hay) directo de IA y se lo pasa a la isla
// cliente, que desde ahí trabaja contra los proxies /api/mostrador/*. Si IA
// no responde se pinta la pantalla igual, con el aviso: el vendedor puede
// reintentar desde ahí sin quedarse frente a una página en blanco.

export const metadata: Metadata = {
  title: "Nuevo pedido",
};

export const dynamic = "force-dynamic";

const RUTA_ESTA = "/mostrador/nuevo";

export default async function PaginaNuevoPedido() {
  const sesion = await sesionMostrador();
  if (!sesion) redirect(`${RUTA_LOGIN_MOSTRADOR}?volver=${encodeURIComponent(RUTA_ESTA)}`);

  let borrador: PedidoDetalle | null = null;
  let errorInicial: string | null = null;
  try {
    borrador = await obtenerBorrador();
  } catch (error) {
    // obtenerBorrador redirige a login si el token ya no vale: ese "error"
    // es de Next y debe seguir su camino, no pintarse como aviso.
    unstable_rethrow(error);
    console.error("[mostrador] no se pudo cargar el borrador del vendedor", error);
    errorInicial =
      error instanceof Error && error.message
        ? error.message
        : "No fue posible leer tu borrador; intenta de nuevo";
  }

  return (
    <NuevoPedido
      borradorInicial={borrador}
      perfil={sesion.perfil}
      vendedor={sesion.nombre}
      errorInicial={errorInicial}
    />
  );
}
