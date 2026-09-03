import { proxyMostrador } from "@/lib/mostrador/reenvio";

// Cola de pedidos: los filtros viajan en la querystring tal cual (estatus,
// sucursal, canal, usuario, desde, hasta, busqueda, pagina) y IA los acota.

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return proxyMostrador(request, "/pedidos", { metodo: "GET" });
}
