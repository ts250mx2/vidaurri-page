import { idDeRuta, proxyMostrador, respuestaError } from "@/lib/mostrador/reenvio";

// Quita una partida del borrador del vendedor.

export const dynamic = "force-dynamic";

interface Contexto {
  params: Promise<{ idPartida: string }>;
}

export async function DELETE(request: Request, { params }: Contexto) {
  const { idPartida } = await params;
  const id = idDeRuta(idPartida);
  if (id === null) return respuestaError(400, "Partida inválida");
  return proxyMostrador(request, `/borrador/partidas/${id}`, { metodo: "DELETE" });
}
