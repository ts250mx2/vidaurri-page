import { proxyMostrador } from "@/lib/mostrador/reenvio";

// Borrador → enviado `{ observaciones?, sucursal? }`: IA asigna el folio y
// responde 409 si el borrador está vacío.

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return proxyMostrador(request, "/borrador/enviar", { metodo: "POST", conCuerpo: true });
}
