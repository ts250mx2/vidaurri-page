import { idDeRuta, proxyMostrador, respuestaError } from "@/lib/mostrador/reenvio";

// Agrega una partida `{ origen, codigo, idPiezaUsada, cantidad }` a un pedido
// que todavía se puede editar (borrador, enviado o confirmado). El precio lo
// cotiza IA con el descuento ACTUAL del cliente del pedido; el navegador nunca
// manda precios. Si el pedido ya se surtió, IA responde 409.

export const dynamic = "force-dynamic";

interface Contexto {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Contexto) {
  const { id } = await params;
  const idPedido = idDeRuta(id);
  if (idPedido === null) return respuestaError(400, "Pedido inválido");
  return proxyMostrador(request, `/pedidos/${idPedido}/partidas`, {
    metodo: "POST",
    conCuerpo: true,
  });
}
