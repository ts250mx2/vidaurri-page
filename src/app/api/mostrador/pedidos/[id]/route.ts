import { idDeRuta, proxyMostrador, respuestaError } from "@/lib/mostrador/reenvio";

// Detalle de un pedido (cabecera, partidas y bitácora).

export const dynamic = "force-dynamic";

interface Contexto {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Contexto) {
  const { id } = await params;
  const idPedido = idDeRuta(id);
  if (idPedido === null) return respuestaError(400, "Pedido inválido");
  return proxyMostrador(request, `/pedidos/${idPedido}`, { metodo: "GET" });
}
