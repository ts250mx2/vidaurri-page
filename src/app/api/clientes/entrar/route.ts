import { reenviarAClientes } from "@/lib/clientes/api";
import { validarCredencialesCliente } from "@/lib/clientes/credenciales";
import {
  iaRechazoCredenciales,
  leerCuerpo,
  respuestaCredenciales,
  respuestaError,
} from "@/lib/clientes/reenvio";
import { ERROR_SIN_SECRETO, ponerCookieCliente } from "@/lib/clientes/sesion";
import { sanearClienteDelPadron } from "@/lib/kiosco/tipos";
import { mensajeDeError, respuestaOk } from "@/lib/mostrador/api";
import { ipDe } from "@/lib/mostrador/reenvio";

// El cliente entra con su celular (usuario) y su contraseña; la primera vez
// la contraseña es el mismo celular (decisión del dueño, 15 sep 2026). IA
// comprueba contra el padrón y contra `clientes_acceso`, pone el tope de
// intentos, y si responde 200 PAGE firma la cookie `cliente_sesion` (12 h).
// Al navegador solo le devuelve el nombre y las dos banderas que pintan la
// pantalla; el id del padrón viaja dentro del token, nunca en el JSON.
//
// La contraseña pasa por aquí en claro (va a IA, que la compara con su hash)
// y no se loguea jamás, ni en el error.

export const dynamic = "force-dynamic";

const ERROR_PETICION = "No entendí la petición; inténtalo otra vez";
const ERROR_ENTRAR = "No pude comprobar tus datos; inténtalo otra vez";
const ERROR_RESPUESTA = "El servidor no devolvió tus datos; inténtalo más tarde";

export async function POST(request: Request) {
  const lectura = await leerCuerpo(request);
  if (!lectura.ok) return respuestaError(400, ERROR_PETICION);

  const validacion = validarCredencialesCliente(lectura.datos);
  if (!validacion.ok) return respuestaError(400, validacion.error);

  const { status, datos } = await reenviarAClientes("/entrar", {
    metodo: "POST",
    cuerpo: validacion.datos,
    cliente: null,
    ip: ipDe(request),
  });
  if (status !== 200 || !respuestaOk(datos)) {
    // 401 (celular o contraseña incorrectos) y 429 (muchos intentos) traen el
    // texto amable de IA; se pasan con su status para que la pantalla los
    // distinga. El 401 se marca como de credenciales: no hay sesión que
    // perder y el formulario lo enseña junto al campo.
    const error = mensajeDeError(datos, ERROR_ENTRAR);
    if (iaRechazoCredenciales(status, datos)) return respuestaCredenciales(error);
    return respuestaError(status >= 400 ? status : 502, error);
  }

  const cliente = sanearClienteDelPadron(datos);
  if (!cliente) {
    console.error("[clientes] IA aceptó las credenciales pero no devolvió al cliente con forma", datos);
    return respuestaError(502, ERROR_RESPUESTA);
  }

  const puesta = await ponerCookieCliente({
    idCliente: cliente.idCliente,
    nombre: cliente.nombre,
    telefono: cliente.telefono,
    permitirPedido: cliente.permitirPedido,
    passwordPorDefecto: cliente.passwordPorDefecto,
  });
  if (!puesta) return respuestaError(500, ERROR_SIN_SECRETO);

  return Response.json({
    ok: true,
    cliente: {
      nombre: cliente.nombre,
      permitirPedido: cliente.permitirPedido,
      passwordPorDefecto: cliente.passwordPorDefecto,
    },
  });
}
