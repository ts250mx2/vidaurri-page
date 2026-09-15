import { reenviarAKiosco } from "@/lib/kiosco/api";
import { borrarCookieCliente, ERROR_SIN_KIOSCO, respuestaError } from "@/lib/kiosco/reenvio";
import { cabeceraKiosco, sesionClienteKiosco, sesionKiosco } from "@/lib/kiosco/sesion";
import { respuestaOk } from "@/lib/mostrador/api";

// Fin del turno del cliente en esta PC: se borra su cookie y el borrador del
// aparato, de una vez. Lo llaman el botón Salir de la barra, el "Listo,
// gracias" del acuse y el reinicio por inactividad, así que también vale sin
// sesión de cliente (entonces solo limpia el borrador). Es una PC compartida:
// el siguiente cliente no debe encontrar ni el nombre ni las piezas del
// anterior, y por eso esto no pide credenciales: cualquiera puede cerrar.

export const dynamic = "force-dynamic";

export async function POST() {
  const sesion = await sesionKiosco();
  if (!sesion) return respuestaError(401, ERROR_SIN_KIOSCO);

  const cliente = await sesionClienteKiosco();
  await borrarCookieCliente();

  // El borrador se borra con la cabecera del cliente si la había (IA lo
  // revalida), y si IA ya no lo reconoce, sin ella: el borrador es del
  // aparato y se tiene que ir de todos modos.
  const { status, datos } = await reenviarAKiosco("/borrador", {
    metodo: "DELETE",
    kiosco: cabeceraKiosco(sesion),
    cliente: cliente?.idCliente ?? null,
  });
  if (status !== 200 || !respuestaOk(datos)) {
    console.error("[kiosco] no se pudo borrar el borrador al cerrar el turno", status, datos);
    // La cookie ya se fue, que es lo importante para la privacidad; el
    // borrador huérfano lo limpia la siguiente inactividad o el siguiente envío.
  }
  return Response.json({ ok: true });
}
