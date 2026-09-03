import { idDeRuta, proxyMostrador, respuestaError } from "@/lib/mostrador/reenvio";

// Confirmación por renglón `{ partidas: [{ id, estatusPartida, diasEntrega?, nota? }] }`.
// No cambia el estatus del pedido: solo lo que el mostrador encontró de cada pieza.

export const dynamic = "force-dynamic";

interface Contexto {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Contexto) {
  const { id } = await params;
  const idPedido = idDeRuta(id);
  if (idPedido === null) return respuestaError(400, "Pedido inválido");
  return proxyMostrador(request, `/pedidos/${idPedido}/partidas/confirmar`, {
    metodo: "POST",
    conCuerpo: true,
  });
}
