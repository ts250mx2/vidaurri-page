import { unstable_rethrow } from "next/navigation";
import { urlSitio } from "@/config/negocio";
import { hojaSurtido } from "@/lib/mostrador/datos";
import { pdfHojaPedido } from "@/lib/mostrador/pdf-pedido";
import { ERROR_NO_AUTORIZADO, idDeRuta, respuestaError } from "@/lib/mostrador/reenvio";
import { sesionMostrador } from "@/lib/mostrador/sesion";
import { RUTA_MOSTRADOR } from "@/lib/mostrador/volver";

// GET /mostrador/pedidos/[id]/pdf: la hoja de pedido como archivo PDF, armada
// en el servidor con los mismos datos que la página de surtido (`hojaSurtido`,
// existencia releída por IA al momento). Vive bajo /mostrador y no bajo /api
// porque es un documento que se abre en el navegador, no un JSON: el proxy de
// borde ya manda a login a quien no trae cookie, y aquí se vuelve a verificar
// la sesión por si se llama sin pasar por él. Nunca se cachea: cada descarga
// relee la existencia.

export const dynamic = "force-dynamic";

interface Contexto {
  params: Promise<{ id: string }>;
}

/** Solo el folio (P-000131) o el id: nada del pedido llega al nombre del archivo. */
function nombreArchivo(folio: string | null, id: number): string {
  const base = (folio ?? String(id)).replace(/[^A-Za-z0-9_-]/g, "");
  return `pedido-${base || id}.pdf`;
}

export async function GET(_request: Request, { params }: Contexto) {
  const sesion = await sesionMostrador();
  if (!sesion) return respuestaError(401, ERROR_NO_AUTORIZADO);

  const { id } = await params;
  const idPedido = idDeRuta(id);
  if (idPedido === null) return respuestaError(400, "Pedido inválido");

  try {
    const hoja = await hojaSurtido(idPedido);
    if (!hoja) return respuestaError(404, "El pedido no existe");

    const pdf = await pdfHojaPedido(hoja, {
      urlPedido: `${urlSitio()}${RUTA_MOSTRADOR}/pedidos/${hoja.pedido.id}`,
    });
    return new Response(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdf.byteLength),
        "Content-Disposition": `inline; filename="${nombreArchivo(hoja.pedido.folio, hoja.pedido.id)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    // `hojaSurtido` redirige (logout → login) si IA rechazó el token: esa
    // excepción es de Next y tiene que seguir su camino.
    unstable_rethrow(error);
    console.error("[mostrador] fallo generando el PDF del pedido", idPedido, error);
    return respuestaError(500, error instanceof Error ? error.message : "No fue posible generar el PDF");
  }
}
