import { proxyKiosco, recortePedido } from "@/lib/kiosco/reenvio";

// Agrega una pieza al borrador del aparato (`CapturaPartida`, sin descuento:
// el precio lo cotiza IA a precio de mostrador). Responde el borrador recortado.

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return proxyKiosco(request, "/borrador/partidas", {
    metodo: "POST",
    conCuerpo: true,
    recortar: recortePedido,
  });
}
