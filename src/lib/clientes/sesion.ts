import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Sesión del cliente en SU dispositivo (área /clientes). Calcada de
// `kiosco/sesion.ts` pero con secreto propio (`CLIENTES_JWT_SECRET`), audiencia
// "clientes" y vida de 12 horas: es su celular o su PC, no una máquina
// compartida, así que no hay reinicio por inactividad. El token lo firma PAGE
// tras un 200 de `POST /api/clientes/entrar` de IA (celular y contraseña) y
// solo sirve aquí: ni abre el kiosco, ni el mostrador, ni al revés.
//
// Dentro va lo que las pantallas necesitan sin volver a IA: quién es, si el
// padrón le permite pedir (para esconder el botón de enviar) y si su
// contraseña sigue siendo el celular (para el aviso de "cámbiala").

export interface SesionCliente {
  /** clientes_descuento.id del padrón; lo que viaja en `X-Cliente`. */
  idCliente: number;
  nombre: string;
  /** Celular nacional de 10 dígitos con el que entró. */
  telefono: string;
  /** `permitir_pedido` del padrón: sin él IA responde 403 al enviar. */
  permitirPedido: boolean;
  /** `true` mientras no cambie la contraseña por defecto (su celular). */
  passwordPorDefecto: boolean;
}

export const COOKIE_CLIENTE = "cliente_sesion";
export const AUDIENCIA_CLIENTES = "clientes";
/** 12 horas: lo que dura una sesión del mostrador; se vuelve a entrar al día siguiente. */
export const DURACION_SESION_CLIENTE_S = 12 * 60 * 60;

export const ERROR_SIN_SECRETO = "El área de clientes no está configurada en este servidor";

const RE_TELEFONO = /^\d{10}$/;

function claveSecreta(): Uint8Array | null {
  const secreto = process.env.CLIENTES_JWT_SECRET;
  if (!secreto) {
    // Sin secreto no se firma ni se verifica nada: el área entera queda
    // cerrada, y se loguea para que ese "no entra nadie" no parezca un bug.
    console.error("[clientes] falta CLIENTES_JWT_SECRET en las variables de entorno");
    return null;
  }
  return new TextEncoder().encode(secreto);
}

/** Token del cliente; null si falta el secreto (el llamador responde que no está configurado). */
export async function firmarTokenCliente(sesion: SesionCliente): Promise<string | null> {
  const clave = claveSecreta();
  if (!clave) return null;
  return new SignJWT({
    idCliente: sesion.idCliente,
    nombre: sesion.nombre,
    telefono: sesion.telefono,
    permitirPedido: sesion.permitirPedido,
    passwordPorDefecto: sesion.passwordPorDefecto,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(AUDIENCIA_CLIENTES)
    .setIssuedAt()
    .setExpirationTime(`${DURACION_SESION_CLIENTE_S}s`)
    .sign(clave);
}

/**
 * Verifica el token del cliente. null si venció, si es de otra audiencia (el
 * del kiosco, el del mostrador) o si el contenido no tiene la forma esperada:
 * un id que no sea entero positivo no llega jamás a la cabecera `X-Cliente`.
 */
export async function verificarTokenCliente(token: string): Promise<SesionCliente | null> {
  const clave = claveSecreta();
  if (!clave || !token) return null;
  try {
    const { payload } = await jwtVerify(token, clave, {
      audience: AUDIENCIA_CLIENTES,
      algorithms: ["HS256"],
    });
    const { idCliente, nombre, telefono, permitirPedido, passwordPorDefecto } = payload;
    if (typeof idCliente !== "number" || !Number.isInteger(idCliente) || idCliente <= 0) return null;
    if (typeof nombre !== "string" || !nombre.trim()) return null;
    if (typeof telefono !== "string" || !RE_TELEFONO.test(telefono)) return null;
    return {
      idCliente,
      nombre: nombre.trim(),
      telefono,
      // Banderas ausentes se leen como lo más restrictivo / más insistente:
      // sin permiso de pedir y con la contraseña por cambiar.
      permitirPedido: permitirPedido === true,
      passwordPorDefecto: passwordPorDefecto !== false,
    };
  } catch {
    return null;
  }
}

/** Sesión del cliente a partir de su cookie; null si no entró o ya venció. */
export async function sesionCliente(): Promise<SesionCliente | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_CLIENTE)?.value?.trim();
  return token ? verificarTokenCliente(token) : null;
}

/**
 * Firma y deja la cookie del cliente. Devuelve `false` si falta el secreto.
 * La llaman `entrar` (sesión nueva) y `password` (la misma sesión refirmada
 * con `passwordPorDefecto: false` para que el aviso se apague).
 */
export async function ponerCookieCliente(sesion: SesionCliente): Promise<boolean> {
  const token = await firmarTokenCliente(sesion);
  if (!token) return false;
  const jar = await cookies();
  jar.set({
    name: COOKIE_CLIENTE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SESION_CLIENTE_S,
    secure: process.env.NODE_ENV === "production",
  });
  return true;
}

/** Borra la cookie del cliente: al salir, y cuando IA dice que ese cliente ya no vale. */
export async function borrarCookieCliente(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_CLIENTE);
}
