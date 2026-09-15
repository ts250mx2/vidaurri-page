import { cookies } from "next/headers";
import { validarCredencialesCliente } from "@/lib/clientes/credenciales";
import { iaRechazoCredenciales, respuestaCredenciales } from "@/lib/clientes/reenvio";
import { reenviarAKiosco } from "@/lib/kiosco/api";
import { ERROR_SIN_KIOSCO, respuestaError } from "@/lib/kiosco/reenvio";
import {
  cabeceraKiosco,
  COOKIE_KIOSCO_CLIENTE,
  DURACION_CLIENTE_S,
  ERROR_SIN_SECRETO,
  firmarTokenCliente,
  sesionKiosco,
} from "@/lib/kiosco/sesion";
import { sanearClienteDelPadron } from "@/lib/kiosco/tipos";
import { mensajeDeError, respuestaOk } from "@/lib/mostrador/api";

// El cliente registrado entra al kiosco con su celular (usuario) y su
// contraseña, la primera vez el mismo celular (decisión del dueño, 15 sep
// 2026; antes bastaba el número). IA usa la MISMA lógica que el área de
// clientes (`clientes_acceso`) más el tope de intentos por aparato; si
// responde 200, PAGE firma la cookie del cliente (30 min) y al navegador solo
// le devuelve el nombre. El id del padrón viaja dentro del token, nunca en el
// JSON. La contraseña no se loguea jamás.
//
// No se manda `X-Kiosco-Cliente` aunque hubiera una sesión vieja: entrar es
// justo empezar de cero, y IA borra el borrador del aparato al aceptar.

export const dynamic = "force-dynamic";

const ERROR_PETICION = "No entendí la petición; inténtalo otra vez";
const ERROR_ENTRAR = "No pude comprobar tus datos; inténtalo otra vez";
const ERROR_RESPUESTA = "El servidor no devolvió tus datos; pide ayuda en el mostrador";

export async function POST(request: Request) {
  const sesion = await sesionKiosco();
  if (!sesion) return respuestaError(401, ERROR_SIN_KIOSCO);

  const cuerpo: unknown = await request.json().catch(() => null);
  if (typeof cuerpo !== "object" || cuerpo === null) return respuestaError(400, ERROR_PETICION);
  const validacion = validarCredencialesCliente(cuerpo);
  if (!validacion.ok) return respuestaError(400, validacion.error);

  const { status, datos } = await reenviarAKiosco("/cliente/entrar", {
    metodo: "POST",
    cuerpo: validacion.datos,
    kiosco: cabeceraKiosco(sesion),
  });
  if (status !== 200 || !respuestaOk(datos)) {
    // 401 (celular o contraseña incorrectos) y 429 (muchos intentos) traen el
    // texto amable de IA; se pasan con su status para que la pantalla los
    // distinga. El 401 de credenciales se marca como tal: el aparato sigue
    // activo y el formulario lo enseña; un 401 del guardia (aparato o llave)
    // pasa sin marca y la pantalla sale a activar.
    const error = mensajeDeError(datos, ERROR_ENTRAR);
    if (iaRechazoCredenciales(status, datos)) return respuestaCredenciales(error);
    return respuestaError(status >= 400 ? status : 502, error);
  }

  const cliente = sanearClienteDelPadron(datos);
  if (!cliente) {
    console.error("[kiosco] IA aceptó las credenciales pero no devolvió al cliente con forma", datos);
    return respuestaError(502, ERROR_RESPUESTA);
  }

  const token = await firmarTokenCliente({
    idCliente: cliente.idCliente,
    nombre: cliente.nombre,
    telefono: cliente.telefono,
  });
  if (!token) return respuestaError(500, ERROR_SIN_SECRETO);

  const jar = await cookies();
  jar.set({
    name: COOKIE_KIOSCO_CLIENTE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_CLIENTE_S,
    secure: process.env.NODE_ENV === "production",
  });

  return Response.json({ ok: true, cliente: { nombre: cliente.nombre } });
}
