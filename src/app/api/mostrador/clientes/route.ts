import { proxyMostrador } from "@/lib/mostrador/reenvio";

// Padrón de clientes con descuento: GET `?busqueda=` (máx. 20) y POST alta
// rápida `{ cliente, telefono?, rfc?, email?, descuento? }` (409 con el
// existente si el celular ya es de otro cliente).

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return proxyMostrador(request, "/clientes", { metodo: "GET" });
}

export async function POST(request: Request) {
  return proxyMostrador(request, "/clientes", { metodo: "POST", conCuerpo: true });
}
