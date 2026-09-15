import { proxyKiosco, recorteVico } from "@/lib/kiosco/reenvio";

// Vico atendiendo al cliente parado en el mostrador (actor `kiosco` en IA:
// busca y agrega, pero NO envía el pedido; eso es un botón de la pantalla).
// Piensa y consulta bases antes de contestar, por eso el tope de dos minutos.

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Un poco por debajo de maxDuration para alcanzar a responder con error legible. */
const TIEMPO_MAXIMO_VICO_MS = 115_000;

export async function POST(request: Request) {
  return proxyKiosco(request, "/vico", {
    metodo: "POST",
    conCuerpo: true,
    tiempoMaximoMs: TIEMPO_MAXIMO_VICO_MS,
    recortar: recorteVico,
  });
}
