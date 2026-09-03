import { idDeRuta, proxyMostrador, respuestaError } from "@/lib/mostrador/reenvio";

// Cambio de estatus `{ estatus, motivo?, folioVentaPos? }`. Quién puede hacer
// qué lo decide IA con el perfil del token (403 si no); aquí solo se reenvía.

export const dynamic = "force-dynamic";

interface Contexto {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Contexto) {
  const { id } = await params;
  const idPedido = idDeRuta(id);
  if (idPedido === null) return respuestaError(400, "Pedido inválido");
  return proxyMostrador(request, `/pedidos/${idPedido}/estatus`, {
    metodo: "POST",
    conCuerpo: true,
  });
}
