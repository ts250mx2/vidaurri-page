import { proxyClientes } from "@/lib/clientes/reenvio";
import { recortePedido } from "@/lib/kiosco/reenvio";

// Agrega una pieza al borrador del cliente (`CapturaPartida`; el precio lo
// cotiza IA con su descuento). Responde el borrador recortado.

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return proxyClientes(request, "/borrador/partidas", {
    metodo: "POST",
    conCuerpo: true,
    recortar: recortePedido,
  });
}
