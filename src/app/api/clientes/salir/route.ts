import { borrarCookieCliente } from "@/lib/clientes/sesion";

// Salir del área de clientes: se borra la cookie y nada más. El borrador NO
// se toca: es el del cliente (`c:<telefono>`, el mismo que arma por WhatsApp)
// y sigue siendo suyo aunque cierre la sesión en este dispositivo. No pide
// credenciales: cerrar la propia sesión no necesita permiso.

export const dynamic = "force-dynamic";

export async function POST() {
  await borrarCookieCliente();
  return Response.json({ ok: true });
}
