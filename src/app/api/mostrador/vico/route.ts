import { proxyMostrador } from "@/lib/mostrador/reenvio";

// Vico en modo vendedor `{ sesion, mensaje, reiniciar?, idCliente }`. IA
// responde con el texto, las fotos y el borrador tal como quedó tras el
// turno. Piensa y consulta bases antes de contestar, por eso este proxy es
// el único con tope de dos minutos (como el chat público de /api/chat).

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Un poco por debajo de maxDuration para alcanzar a responder con error legible. */
const TIEMPO_MAXIMO_VICO_MS = 115_000;

export async function POST(request: Request) {
  return proxyMostrador(request, "/vico", {
    metodo: "POST",
    conCuerpo: true,
    tiempoMaximoMs: TIEMPO_MAXIMO_VICO_MS,
  });
}
