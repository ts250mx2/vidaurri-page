import { proxyClientes } from "@/lib/clientes/reenvio";
import { recortePedido } from "@/lib/kiosco/reenvio";

// Borrador vivo del cliente (`c:<telefono>`, el mismo que arma por WhatsApp):
// GET lo lee, DELETE lo vacía. No hay POST: nace solo al agregar la primera pieza.

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return proxyClientes(request, "/borrador", { metodo: "GET", recortar: recortePedido });
}

export async function DELETE(request: Request) {
  return proxyClientes(request, "/borrador", { metodo: "DELETE" });
}
