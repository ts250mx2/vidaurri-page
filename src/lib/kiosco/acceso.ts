import { mensajeDeError, reenviarAMostrador } from "@/lib/mostrador/api";
import { perfilDe, type PerfilPos } from "@/lib/mostrador/sesion";

// Comprobar credenciales del POS para ACTIVAR el kiosco o para sacarlo del
// modo kiosco. Se reenvían a `POST /api/mostrador/login` de IA (que ya existe)
// con la API key servidor→servidor; si el login vale, PAGE se queda SOLO con
// el perfil y el nombre: el token del vendedor se descarta ahí mismo y jamás
// toca una cookie. Un kiosco con sesión de vendedor guardada sería justo lo
// que el contrato prohíbe.

const USUARIO_MAX = 50;
const CLAVE_MAX = 200;

export const ERROR_CREDENCIALES = "Escribe tu usuario y tu contraseña del POS";
export const ERROR_LARGOS = "Usuario o contraseña demasiado largos";
export const ERROR_ENTRAR = "No fue posible comprobar tus datos";

/** Perfiles del POS que pueden convertir una PC en kiosco. */
const PERFILES_QUE_ACTIVAN: ReadonlyArray<PerfilPos> = ["Administrador", "Operaciones"];

export function puedeActivarKiosco(perfil: PerfilPos): boolean {
  return PERFILES_QUE_ACTIVAN.includes(perfil);
}

export interface Credenciales {
  usuario: string;
  clave: string;
}

export function validarCredenciales(
  entrada: unknown
): { ok: true; datos: Credenciales } | { ok: false; error: string } {
  if (typeof entrada !== "object" || entrada === null) return { ok: false, error: ERROR_CREDENCIALES };
  const { usuario, clave } = entrada as { usuario?: unknown; clave?: unknown };
  const usuarioLimpio = typeof usuario === "string" ? usuario.trim() : "";
  const claveTexto = typeof clave === "string" ? clave : "";
  if (!usuarioLimpio || !claveTexto) return { ok: false, error: ERROR_CREDENCIALES };
  if (usuarioLimpio.length > USUARIO_MAX || claveTexto.length > CLAVE_MAX) {
    return { ok: false, error: ERROR_LARGOS };
  }
  return { ok: true, datos: { usuario: usuarioLimpio, clave: claveTexto } };
}

export interface UsuarioPos {
  nombre: string;
  perfil: PerfilPos;
}

export type Comprobacion =
  | { ok: true; usuario: UsuarioPos }
  | { ok: false; status: number; error: string };

function sesionDe(datos: unknown): UsuarioPos | null {
  if (typeof datos !== "object" || datos === null) return null;
  const { ok, token, sesion } = datos as { ok?: unknown; token?: unknown; sesion?: unknown };
  if (ok !== true || typeof token !== "string" || !token) return null;
  if (typeof sesion !== "object" || sesion === null) return null;
  const { usuario, nombre, perfil } = sesion as Record<string, unknown>;
  const clave = typeof usuario === "string" ? usuario.trim() : "";
  if (!clave) return null;
  return {
    nombre: typeof nombre === "string" && nombre.trim() ? nombre.trim() : clave,
    perfil: perfilDe(perfil),
  };
}

/**
 * Comprueba usuario y clave contra el POS. El token que firma IA se ignora a
 * propósito (ver arriba). Los mensajes de error de IA se pasan tal cual: son
 * los que el personal del mostrador ya conoce del login de siempre.
 */
export async function comprobarUsuarioPos(
  credenciales: Credenciales,
  ip: string | null
): Promise<Comprobacion> {
  const { status, datos } = await reenviarAMostrador("/login", {
    metodo: "POST",
    cuerpo: credenciales,
    token: null,
    ip,
  });
  const usuario = status === 200 ? sesionDe(datos) : null;
  if (!usuario) {
    // Un 200 con forma rara es un problema de IA, no de quien teclea: 502.
    return { ok: false, status: status >= 400 ? status : 502, error: mensajeDeError(datos, ERROR_ENTRAR) };
  }
  return { ok: true, usuario };
}
