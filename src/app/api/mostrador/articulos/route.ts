import { proxyMostrador } from "@/lib/mostrador/reenvio";

// Buscador manual de artículos `?busqueda=&idCliente=`: el precio viene ya con
// el descuento de ese cliente (o de mostrador si no hay cliente).

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return proxyMostrador(request, "/articulos", { metodo: "GET" });
}
