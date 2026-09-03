import { proxyMostrador } from "@/lib/mostrador/reenvio";

// Borrador del vendedor (el actor lo saca IA del token): GET lo lee, POST lo
// crea o reemplaza `{ idCliente, sucursal? }` (409 con el pedido si ya trae
// partidas y cambia el cliente), DELETE lo cancela.

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return proxyMostrador(request, "/borrador", { metodo: "GET" });
}

export async function POST(request: Request) {
  return proxyMostrador(request, "/borrador", { metodo: "POST", conCuerpo: true });
}

export async function DELETE(request: Request) {
  return proxyMostrador(request, "/borrador", { metodo: "DELETE" });
}
