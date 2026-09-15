import { proxyClientes, respuestaError } from "@/lib/clientes/reenvio";
import { idDeRuta, recortePedido } from "@/lib/kiosco/reenvio";

// Un renglón del borrador: PATCH `{ cantidad }` lo cambia (el ± de la
// pantalla), DELETE lo quita. IA recalcula los totales y devuelve el borrador.

export const dynamic = "force-dynamic";

interface Contexto {
  params: Promise<{ idPartida: string }>;
}

const ERROR_PARTIDA = "Esa pieza ya no está en tu pedido";

async function idPartidaDe({ params }: Contexto): Promise<number | null> {
  const { idPartida } = await params;
  return idDeRuta(idPartida);
}

export async function PATCH(request: Request, contexto: Contexto) {
  const id = await idPartidaDe(contexto);
  if (id === null) return respuestaError(400, ERROR_PARTIDA);
  return proxyClientes(request, `/borrador/partidas/${id}`, {
    metodo: "PATCH",
    conCuerpo: true,
    recortar: recortePedido,
  });
}

export async function DELETE(request: Request, contexto: Contexto) {
  const id = await idPartidaDe(contexto);
  if (id === null) return respuestaError(400, ERROR_PARTIDA);
  return proxyClientes(request, `/borrador/partidas/${id}`, {
    metodo: "DELETE",
    recortar: recortePedido,
  });
}
