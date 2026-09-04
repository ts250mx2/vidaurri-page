import { idDeRuta, proxyMostrador, respuestaError } from "@/lib/mostrador/reenvio";

// Reintento manual de la cotización espejo en el POS (contrato B6). IA la
// levanta sola al marcar el pedido listo; esta ruta vuelve a intentarlo cuando
// falló o quedó pendiente. Solo la acepta con el pedido listo o entregado y
// responde `{ ok, pedido }`; aquí solo se reenvía con la sesión del vendedor.

export const dynamic = "force-dynamic";

interface Contexto {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Contexto) {
  const { id } = await params;
  const idPedido = idDeRuta(id);
  if (idPedido === null) return respuestaError(400, "Pedido inválido");
  return proxyMostrador(request, `/pedidos/${idPedido}/cotizacion`, {
    metodo: "POST",
    conCuerpo: true,
  });
}
