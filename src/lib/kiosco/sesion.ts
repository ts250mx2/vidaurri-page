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
