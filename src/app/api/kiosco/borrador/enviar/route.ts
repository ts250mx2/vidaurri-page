import { proxyKiosco, recorteAcuse } from "@/lib/kiosco/reenvio";

// Manda el pedido con `{ nombre, telefono }`. IA lo crea en canal `kiosco`,
// sucursal la del aparato, cliente público general, y responde SOLO folio,
// piezas y total: ni id, ni partidas, ni nada con qué seguir husmeando.

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return proxyKiosco(request, "/borrador/enviar", {
    metodo: "POST",
    conCuerpo: true,
    recortar: recorteAcuse,
  });
}
