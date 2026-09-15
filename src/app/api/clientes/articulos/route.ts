import { proxyClientes } from "@/lib/clientes/reenvio";
import { recorteArticulos } from "@/lib/kiosco/reenvio";

// Buscador del cliente `?busqueda=`: catálogo con SU descuento del padrón (IA
// lo aplica por `X-Cliente`). El recorte deja código, descripción, precio con
// IVA y un booleano de existencia: la cifra exacta no llega al navegador.

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return proxyClientes(request, "/articulos", { metodo: "GET", recortar: recorteArticulos });
}
