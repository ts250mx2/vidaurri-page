import { reenviarAClientes } from "@/lib/clientes/api";
import { validarCambioPassword } from "@/lib/clientes/credenciales";
import {
  ERROR_SESION_RECHAZADA,
  ERROR_SIN_SESION,
  iaRechazoAlCliente,
  iaRechazoCredenciales,
  leerCuerpo,
  respuestaCredenciales,
  respuestaError,
  respuestaSinSesion,
} from "@/lib/clientes/reenvio";
import {
  borrarCookieCliente,
  ERROR_SIN_SECRETO,
  ponerCookieCliente,
  sesionCliente,
} from "@/lib/clientes/sesion";
import { mensajeDeError, respuestaOk } from "@/lib/mostrador/api";

// Cambio de contraseña: `{ actual, nueva }` (la confirmación se comprueba en
// el navegador y aquí, pero a IA solo le viajan las dos). IA verifica la
// actual, valida la nueva y guarda el hash; si sale bien, la MISMA sesión se
// refirma con `passwordPorDefecto: false` para que el aviso de "cámbiala" se
// apague sin volver a entrar. No se pasa por `proxyClientes` porque hay que
// tocar la cookie después de la respuesta.

export const dynamic = "force-dynamic";

const ERROR_PETICION = "No entendí la petición; inténtalo otra vez";
const ERROR_CAMBIO = "No pude cambiar tu contraseña; inténtalo otra vez";

export async function POST(request: Request) {
  const sesion = await sesionCliente();
  if (!sesion) return respuestaSinSesion(ERROR_SIN_SESION);

  const lectura = await leerCuerpo(request);
  if (!lectura.ok) return respuestaError(400, ERROR_PETICION);
  const { actual, nueva, confirmacion } = lectura.datos;
  // Con la confirmación si vino; si el navegador no la manda, se toma la nueva
  // (la regla de coincidencia ya la aplicó el formulario).
  const validacion = validarCambioPassword(actual, nueva, confirmacion ?? nueva, sesion.telefono);
  if (!validacion.ok) return respuestaError(400, validacion.error);

  const { status, datos } = await reenviarAClientes("/password", {
    metodo: "POST",
    cuerpo: validacion.datos,
    cliente: sesion.idCliente,
  });
  if (iaRechazoAlCliente(status, datos)) {
    console.error("[clientes] IA rechazó la sesión del cliente al cambiar contraseña", sesion.idCliente);
    await borrarCookieCliente();
    return respuestaSinSesion(ERROR_SESION_RECHAZADA);
  }
  if (status !== 200 || !respuestaOk(datos)) {
    // 401 "La contraseña actual no es correcta" es un error del formulario,
    // NO una sesión perdida: se marca como de credenciales para que la
    // pantalla lo enseñe junto al campo en vez de mandar a entrar.
    const error = mensajeDeError(datos, ERROR_CAMBIO);
    if (iaRechazoCredenciales(status, datos)) return respuestaCredenciales(error);
    return respuestaError(status >= 400 ? status : 502, error);
  }

  const puesta = await ponerCookieCliente({ ...sesion, passwordPorDefecto: false });
  if (!puesta) return respuestaError(500, ERROR_SIN_SECRETO);
  return Response.json({ ok: true });
}
