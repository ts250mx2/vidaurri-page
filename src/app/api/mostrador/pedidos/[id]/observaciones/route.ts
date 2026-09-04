import { idDeRuta, proxyMostrador, respuestaError } from "@/lib/mostrador/reenvio";

// Actualiza las observaciones `{ observaciones }` de un pedido editable (vacío
// o null las borra). IA limpia y acota el texto y registra el evento; 409 si
// el pedido ya se surtió.

export const dynamic = "force-dynamic";

interface Contexto {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Contexto) {
  const { id } = await params;
  const idPedido = idDeRuta(id);
  if (idPedido === null) return respuestaError(400, "Pedido inválido");
  return proxyMostrador(request, `/pedidos/${idPedido}/observaciones`, {
    metodo: "POST",
    conCuerpo: true,
  });
}
