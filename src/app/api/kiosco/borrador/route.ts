import { proxyKiosco, recortePedido } from "@/lib/kiosco/reenvio";

// Borrador vivo de este aparato (IA lo identifica por la cabecera `X-Kiosco`):
// GET lo lee, DELETE lo limpia cuando el cliente se va o se acaba el tiempo de
// inactividad. No hay POST: el borrador nace solo al agregar la primera pieza.

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return proxyKiosco(request, "/borrador", { metodo: "GET", recortar: recortePedido });
}

export async function DELETE(request: Request) {
  return proxyKiosco(request, "/borrador", { metodo: "DELETE" });
}
