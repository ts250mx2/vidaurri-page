import { proxyKiosco, recorteArticulos } from "@/lib/kiosco/reenvio";

// Buscador del kiosco `?busqueda=`: catálogo a precio de mostrador (con IVA),
// sin descuentos de padrón. El recorte deja código, descripción, precio y un
// booleano de existencia: la cifra exacta no llega al navegador.

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return proxyKiosco(request, "/articulos", { metodo: "GET", recortar: recorteArticulos });
}
