import { idDeRuta, proxyMostrador, respuestaError } from "@/lib/mostrador/reenvio";

// Una partida de un pedido editable: PATCH `{ cantidad }` la cambia (usadas
// siempre 1 y nunca más de la existencia al pedir: lo impone IA), DELETE la
// quita. IA recalcula totales, registra el evento y, si el pedido estaba
// confirmado, regresa la partida tocada a pendiente. 409 si ya se surtió.

export const dynamic = "force-dynamic";

interface Contexto {
  params: Promise<{ id: string; idPartida: string }>;
}

interface Ids {
  idPedido: number;
  idPartida: number;
}

async function idsDe({ params }: Contexto): Promise<Ids | null> {
  const { id, idPartida } = await params;
  const pedido = idDeRuta(id);
  const partida = idDeRuta(idPartida);
  if (pedido === null || partida === null) return null;
  return { idPedido: pedido, idPartida: partida };
}

export async function PATCH(request: Request, contexto: Contexto) {
  const ids = await idsDe(contexto);
  if (ids === null) return respuestaError(400, "Pedido o partida inválidos");
  return proxyMostrador(request, `/pedidos/${ids.idPedido}/partidas/${ids.idPartida}`, {
    metodo: "PATCH",
    conCuerpo: true,
  });
}

export async function DELETE(request: Request, contexto: Contexto) {
  const ids = await idsDe(contexto);
  if (ids === null) return respuestaError(400, "Pedido o partida inválidos");
  return proxyMostrador(request, `/pedidos/${ids.idPedido}/partidas/${ids.idPartida}`, {
    metodo: "DELETE",
  });
}
