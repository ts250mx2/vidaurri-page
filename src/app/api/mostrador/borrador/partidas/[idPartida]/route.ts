import { idDeRuta, proxyMostrador, respuestaError } from "@/lib/mostrador/reenvio";

// Una partida del borrador del vendedor de la cookie: PATCH `{ cantidad }` la
// cambia (usadas siempre 1: lo impone IA), DELETE la quita. IA recalcula los
// totales y responde con el borrador completo.

export const dynamic = "force-dynamic";

interface Contexto {
  params: Promise<{ idPartida: string }>;
}

async function idPartidaDe({ params }: Contexto): Promise<number | null> {
  const { idPartida } = await params;
  return idDeRuta(idPartida);
}

export async function PATCH(request: Request, contexto: Contexto) {
  const id = await idPartidaDe(contexto);
  if (id === null) return respuestaError(400, "Partida inválida");
  return proxyMostrador(request, `/borrador/partidas/${id}`, { metodo: "PATCH", conCuerpo: true });
}

export async function DELETE(request: Request, contexto: Contexto) {
  const id = await idPartidaDe(contexto);
  if (id === null) return respuestaError(400, "Partida inválida");
  return proxyMostrador(request, `/borrador/partidas/${id}`, { metodo: "DELETE" });
}
