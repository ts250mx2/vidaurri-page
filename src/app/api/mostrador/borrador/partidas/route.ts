import { proxyMostrador } from "@/lib/mostrador/reenvio";

// Agrega una partida al borrador `{ origen, codigo, idPiezaUsada, cantidad }`.
// El precio lo calcula IA con el descuento del cliente del borrador: el
// navegador nunca manda precios.

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return proxyMostrador(request, "/borrador/partidas", { metodo: "POST", conCuerpo: true });
}
