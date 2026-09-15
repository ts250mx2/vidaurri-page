import { proxyClientes } from "@/lib/clientes/reenvio";
import { recorteVico } from "@/lib/kiosco/reenvio";

// Vico atendiendo al cliente registrado (actor `cliente` en IA, con su
// descuento; sesión de chat propia mandada por la pantalla, NO la memoria de
// WhatsApp). Busca y agrega al borrador, pero NO envía el pedido: eso es un
// botón de la pantalla. Piensa y consulta bases, por eso el tope de dos minutos.

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Un poco por debajo de maxDuration para alcanzar a responder con error legible. */
const TIEMPO_MAXIMO_VICO_MS = 115_000;

export async function POST(request: Request) {
  return proxyClientes(request, "/vico", {
    metodo: "POST",
    conCuerpo: true,
    tiempoMaximoMs: TIEMPO_MAXIMO_VICO_MS,
    recortar: recorteVico,
  });
}
