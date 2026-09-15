import { proxyClientes } from "@/lib/clientes/reenvio";
import { recorteAcuse } from "@/lib/kiosco/reenvio";

// Manda el pedido con `{ sucursal, observaciones? }`: la sucursal la elige el
// cliente (IA la valida), el nombre y el celular salen del padrón. IA lo crea
// en canal `web`, exige `permitir_pedido` (403 si no) y responde SOLO folio,
// piezas y total.

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return proxyClientes(request, "/borrador/enviar", {
    metodo: "POST",
    conCuerpo: true,
    recortar: recorteAcuse,
  });
}
