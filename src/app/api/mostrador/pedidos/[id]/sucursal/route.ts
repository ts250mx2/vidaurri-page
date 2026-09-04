import { idDeRuta, proxyMostrador, respuestaError } from "@/lib/mostrador/reenvio";

// Cambia la sucursal donde recoge el cliente `{ sucursal }` en un pedido
// editable. IA valida la clave y registra `sucursal_cambiada`; 409 si el
// pedido ya se surtió.

export const dynamic = "force-dynamic";

interface Contexto {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Contexto) {
  const { id } = await params;
  const idPedido = idDeRuta(id);
  if (idPedido === null) return respuestaError(400, "Pedido inválido");
  return proxyMostrador(request, `/pedidos/${idPedido}/sucursal`, {
    metodo: "POST",
    conCuerpo: true,
  });
}
