import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { SucursalEntrega } from "@/lib/mostrador/tipos";
import { esClaveKiosco, esSucursalEntrega } from "./identidad";

// La credencial del kiosco es del APARATO, no del cliente: mientras esta PC
// tenga la cookie, cualquiera que se pare enfrente puede armar un pedido, y
// nadie tiene sesión de vendedor. Por eso el token lo firma PAGE (no IA) con
// un secreto propio, `KIOSCO_JWT_SECRET`, y con audiencia "kiosco": el token
// del mostrador no vale aquí y este no vale allá, ni aunque alguien copie la
// cookie de una máquina a otra área.
//
// Dentro no va NADA del cliente: solo qué aparato es, cómo se llama y en qué
// sucursal está. Es lo único que el guardia de IA necesita (`X-Kiosco`).

export interface SesionKiosco {
  /** Identificador estable del aparato: `[a-z0-9-]{1,30}`. */
  kiosco: string;
  sucursal: SucursalEntrega;
  /** Nombre legible ("Kiosco Matriz 1"), para que el personal sepa cuál es. */
  nombre: string;
}

export const COOKIE_KIOSCO = "kiosco_dispositivo";
export const AUDIENCIA_KIOSCO = "kiosco";
/** 180 días: se activa una vez y la PC se queda así hasta que alguien la saque. */
export const DURACION_KIOSCO_S = 180 * 24 * 60 * 60;

export const ERROR_SIN_SECRETO = "El kiosco no está configurado en este servidor";

function claveSecreta(): Uint8Array | null {
  const secreto = process.env.KIOSCO_JWT_SECRET;
  if (!secreto) {
    // Sin secreto no se firma ni se verifica nada: el área entera queda
    // cerrada, y se loguea para que ese "no entra nadie" no parezca un bug.
    console.error("[kiosco] falta KIOSCO_JWT_SECRET en las variables de entorno");
    return null;
  }
  return new TextEncoder().encode(secreto);
}

/** Token del aparato; null si falta el secreto (el llamador responde que no está configurado). */
export async function firmarTokenKiosco(sesion: SesionKiosco): Promise<string | null> {
  const clave = claveSecreta();
  if (!clave) return null;
  return new SignJWT({ kiosco: sesion.kiosco, sucursal: sesion.sucursal, nombre: sesion.nombre })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(AUDIENCIA_KIOSCO)
    .setIssuedAt()
    .setExpirationTime(`${DURACION_KIOSCO_S}s`)
    .sign(clave);
}

/**
 * Verifica el token del aparato. null si está vencido, firmado con otro
 * secreto o es de otra audiencia (el del mostrador, por ejemplo). La clave y
 * la sucursal se revalidan aunque vengan firmadas: si un día cambia la lista
 * de sucursales, un token viejo no debe colar una que ya no existe.
 */
export async function verificarTokenKiosco(token: string): Promise<SesionKiosco | null> {
  const clave = claveSecreta();
  if (!clave || !token) return null;
  try {
    const { payload } = await jwtVerify(token, clave, {
      audience: AUDIENCIA_KIOSCO,
      algorithms: ["HS256"],
    });
    const { kiosco, sucursal, nombre } = payload;
    if (!esClaveKiosco(kiosco) || !esSucursalEntrega(sucursal)) return null;
    return {
      kiosco,
      sucursal,
      nombre: typeof nombre === "string" && nombre.trim() ? nombre.trim() : kiosco,
    };
  } catch {
    return null;
  }
}

/** Sesión del aparato a partir de la cookie; null si no hay o no vale. */
export async function sesionKiosco(): Promise<SesionKiosco | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_KIOSCO)?.value?.trim();
  return token ? verificarTokenKiosco(token) : null;
}

/** Cabecera `X-Kiosco` que exige el guardia de IA: `<kiosco>|<sucursal>`. */
export function cabeceraKiosco(sesion: SesionKiosco): string {
  return `${sesion.kiosco}|${sesion.sucursal}`;
}

// --- Sesión del CLIENTE (encima de la del aparato) -------------------------
//
// El cliente registrado puede entrar con su celular (contrato kiosco-cliente,
// 15 sep 2026). Es una segunda cookie, aparte de la del aparato, con otra
// audiencia y una vida corta: 30 minutos. Es una PC compartida en el piso de
// la tienda, así que la sesión muere sola (inactividad, "Listo, gracias",
// Salir) y el siguiente cliente jamás ve el nombre ni los pedidos del
// anterior. Sin esta cookie todo sigue como público general.

export interface SesionClienteKiosco {
  /** clientes_descuento.id del padrón; lo que viaja en `X-Kiosco-Cliente`. */
  idCliente: number;
  nombre: string;
  /** Celular nacional de 10 dígitos con el que entró. */
  telefono: string;
}

export const COOKIE_KIOSCO_CLIENTE = "kiosco_cliente";
export const AUDIENCIA_KIOSCO_CLIENTE = "kiosco-cliente";
/** 30 minutos: lo que tarda un cliente en armar y mandar su pedido, no más. */
export const DURACION_CLIENTE_S = 30 * 60;

const RE_TELEFONO = /^\d{10}$/;

/** Token del cliente; null si falta el secreto. */
export async function firmarTokenCliente(sesion: SesionClienteKiosco): Promise<string | null> {
  const clave = claveSecreta();
  if (!clave) return null;
  return new SignJWT({
    idCliente: sesion.idCliente,
    nombre: sesion.nombre,
    telefono: sesion.telefono,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience(AUDIENCIA_KIOSCO_CLIENTE)
    .setIssuedAt()
    .setExpirationTime(`${DURACION_CLIENTE_S}s`)
    .sign(clave);
}

/**
 * Verifica el token del cliente. null si venció, si es de otra audiencia (el
 * del aparato o el del mostrador) o si el contenido no tiene la forma
 * esperada: un id que no sea entero positivo no llega jamás a la cabecera.
 */
export async function verificarTokenCliente(token: string): Promise<SesionClienteKiosco | null> {
  const clave = claveSecreta();
  if (!clave || !token) return null;
  try {
    const { payload } = await jwtVerify(token, clave, {
      audience: AUDIENCIA_KIOSCO_CLIENTE,
      algorithms: ["HS256"],
    });
    const { idCliente, nombre, telefono } = payload;
    if (typeof idCliente !== "number" || !Number.isInteger(idCliente) || idCliente <= 0) return null;
    if (typeof nombre !== "string" || !nombre.trim()) return null;
    if (typeof telefono !== "string" || !RE_TELEFONO.test(telefono)) return null;
    return { idCliente, nombre: nombre.trim(), telefono };
  } catch {
    return null;
  }
}

/** Sesión del cliente a partir de su cookie; null si no entró o ya venció. */
export async function sesionClienteKiosco(): Promise<SesionClienteKiosco | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_KIOSCO_CLIENTE)?.value?.trim();
  return token ? verificarTokenCliente(token) : null;
}
