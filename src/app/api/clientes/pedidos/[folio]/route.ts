import { proxyClientes, respuestaError } from "@/lib/clientes/reenvio";
import { recortePedidoDeCliente } from "@/lib/kiosco/reenvio";
import { folioValido } from "@/lib/kiosco/tipos";

// El detalle de UN pedido del cliente: renglones con su estado y las
// observaciones. Un folio que no es suyo es 404 en IA, sin decir si existe;
// un folio que ni parece folio ni sale de aquí.

export const dynamic = "force-dynamic";

interface Contexto {
  params: Promise<{ folio: string }>;
}

const ERROR_FOLIO = "Ese folio no es tuyo o no existe";

export async function GET(request: Request, { params }: Contexto) {
  const { folio } = await params;
  const limpio = folioValido(folio);
  if (!limpio) return respuestaError(404, ERROR_FOLIO);
  return proxyClientes(request, `/pedidos/${encodeURIComponent(limpio)}`, {
    metodo: "GET",
    recortar: recortePedidoDeCliente,
  });
}
