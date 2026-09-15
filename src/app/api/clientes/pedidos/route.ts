import { proxyClientes } from "@/lib/clientes/reenvio";
import { recortePedidosDeCliente } from "@/lib/kiosco/reenvio";

// Los últimos pedidos del cliente. IA los acota por `X-Cliente` (que sale de
// la cookie, no del navegador) y el recorte deja folio, estatus, fechas,
// piezas y total: nada de ids.

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return proxyClientes(request, "/pedidos", { metodo: "GET", recortar: recortePedidosDeCliente });
}
