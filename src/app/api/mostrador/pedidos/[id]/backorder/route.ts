import { idDeRuta, proxyMostrador, respuestaError } from "@/lib/mostrador/reenvio";

// Back order a Aldo Autopartes del pedido (contrato backorder). IA la levanta
// sola al confirmar el pedido con partidas sobre pedido. GET devuelve la hoja
// para imprimir (`{ ok, hoja }`, con el proveedor releído de bdav, por eso
// nunca se cachea); POST vuelve a intentar la sincronización cuando quedó en
// error o pendiente: IA solo la acepta con el pedido confirmado, listo o
// entregado (409 si no) y responde `{ ok, pedido }`. Aquí solo se reenvía con
// la sesión del vendedor.

export const dynamic = "force-dynamic";

interface Contexto {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Contexto) {
  const { id } = await params;
  const idPedido = idDeRuta(id);
  if (idPedido === null) return respuestaError(400, "Pedido inválido");
  return proxyMostrador(request, `/pedidos/${idPedido}/backorder`, { metodo: "GET" });
}

export async function POST(request: Request, { params }: Contexto) {
  const { id } = await params;
  const idPedido = idDeRuta(id);
  if (idPedido === null) return respuestaError(400, "Pedido inválido");
  return proxyMostrador(request, `/pedidos/${idPedido}/backorder`, {
    metodo: "POST",
    conCuerpo: true,
  });
}
