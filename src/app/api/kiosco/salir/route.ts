import { cookies } from "next/headers";
import { comprobarUsuarioPos, validarCredenciales } from "@/lib/kiosco/acceso";
import { COOKIE_KIOSCO, COOKIE_KIOSCO_CLIENTE } from "@/lib/kiosco/sesion";
import { ipDe } from "@/lib/mostrador/reenvio";

// Salir del modo kiosco: se vuelve a pedir usuario y clave del POS y se borra
// la cookie del aparato. Sin credenciales no se sale, que es lo que impide que
// el cliente curioso convierta el kiosco en un navegador. El borrador vivo se
// queda en IA: lo limpia la inactividad o el siguiente cliente.

export const dynamic = "force-dynamic";

const ERROR_PETICION = "No entendí la petición";

export async function POST(request: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return Response.json({ ok: false, error: ERROR_PETICION }, { status: 400 });
  }

  const credenciales = validarCredenciales(cuerpo);
  if (!credenciales.ok) {
    return Response.json({ ok: false, error: credenciales.error }, { status: 400 });
  }

  const comprobacion = await comprobarUsuarioPos(credenciales.datos, ipDe(request));
  if (!comprobacion.ok) {
    return Response.json({ ok: false, error: comprobacion.error }, { status: comprobacion.status });
  }

  const jar = await cookies();
  jar.delete(COOKIE_KIOSCO);
  // Sin aparato no hay cliente: la sesión del cliente se va con la del kiosco.
  jar.delete(COOKIE_KIOSCO_CLIENTE);
  return Response.json({ ok: true });
}
