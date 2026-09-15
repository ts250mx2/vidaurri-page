import { proxyKiosco, recortePedidosDeCliente } from "@/lib/kiosco/reenvio";

// Los últimos pedidos del cliente que entró con su celular. IA los acota por
// la cabecera `X-Kiosco-Cliente` (que sale de la cookie, no del navegador) y
// el recorte deja folio, estatus, fechas, piezas y total: nada de ids.

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return proxyKiosco(request, "/cliente/pedidos", {
    metodo: "GET",
    exigirCliente: true,
    recortar: recortePedidosDeCliente,
  });
}
