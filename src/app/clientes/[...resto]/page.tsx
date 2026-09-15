import { redirect } from "next/navigation";
import { RUTA_CLIENTES_PEDIDO } from "@/lib/clientes/rutas";

// Cualquier ruta que no exista dentro de /clientes regresa a armar el pedido
// (y el guardia de borde, si no hay sesión, a entrar). Las rutas reales son
// segmentos estáticos y ganan sobre este comodín.

export const dynamic = "force-dynamic";

export default async function ClientesRutaDesconocida() {
  redirect(RUTA_CLIENTES_PEDIDO);
}
