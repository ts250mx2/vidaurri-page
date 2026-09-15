import { redirect } from "next/navigation";
import { RUTA_KIOSCO } from "@/lib/kiosco/rutas";

// Cualquier ruta que no exista dentro de /kiosco regresa al inicio del kiosco.
// Sin esto, un /kiosco/loquesea caería en el 404 del sitio PÚBLICO —con su
// header, su chat y sus enlaces a todo el catálogo—, que es justo la escapatoria
// que el kiosco no debe tener. Las rutas reales (pedido, listo, activar, salir)
// son segmentos estáticos y ganan sobre este comodín.

export const dynamic = "force-dynamic";

export default async function KioscoRutaDesconocida() {
  redirect(RUTA_KIOSCO);
}
