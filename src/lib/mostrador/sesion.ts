import { jwtVerify } from "jose";
import { cookies } from "next/headers";

// Sesión del vendedor en /mostrador. El token lo firma vidaurri-ia
// (`auth-mostrador.ts`, HS256, audiencia "mostrador", 12 h) al hacer login;
// aquí solo se guarda en cookie y se VERIFICA localmente con el mismo secreto
// (`MOSTRADOR_JWT_SECRET`), para que el proxy de borde y los layouts no tengan
// que ir a IA en cada petición. La verdad sobre permisos la impone IA en cada
// llamada con el Bearer: esto solo decide qué pintar y a quién dejar pasar.

export type PerfilPos = "Administrador" | "Operaciones" | "Ventas";

export interface SesionMostrador {
  id: number;
  usuario: string;
  nombre: string;
  perfil: PerfilPos;
  nivel: number;
  serie: string | null;
}

export const COOKIE_MOSTRADOR = "mostrador_sesion";
export const AUDIENCIA_MOSTRADOR = "mostrador";
/** Misma vida que el JWT que firma IA (12 h), en segundos, para el maxAge de la cookie. */
export const DURACION_SESION_MOSTRADOR_S = 12 * 60 * 60;

/** Normaliza el perfil del payload; desconocido → Ventas (mínimo privilegio). */
export function perfilDe(perfil: unknown): PerfilPos {
  const texto = typeof perfil === "string" ? perfil.trim().toLowerCase() : "";
  if (texto === "administrador") return "Administrador";
  if (texto === "operaciones") return "Operaciones";
  return "Ventas";
}

function claveSecreta(): Uint8Array | null {
  const secreto = process.env.MOSTRADOR_JWT_SECRET;
  if (!secreto) {
    // Sin secreto no hay forma de verificar nada: se loguea para que el
    // "no entra nadie" no pase por un bug silencioso.
    console.error("[mostrador] falta MOSTRADOR_JWT_SECRET en las variables de entorno");
    return null;
  }
  return new TextEncoder().encode(secreto);
}

/** Verifica el token del mostrador; null si es inválido, vencido o de otra audiencia. */
export async function verificarTokenMostrador(token: string): Promise<SesionMostrador | null> {
  const clave = claveSecreta();
  if (!clave || !token) return null;
  try {
    const { payload } = await jwtVerify(token, clave, {
      audience: AUDIENCIA_MOSTRADOR,
      algorithms: ["HS256"],
    });
    const id = Number(payload.id);
    const usuario = typeof payload.usuario === "string" ? payload.usuario.trim() : "";
    // Firmado o no, un token sin identidad no sirve para nada aquí.
    if (!Number.isInteger(id) || id <= 0 || !usuario) return null;
    return {
      id,
      usuario,
      nombre: typeof payload.nombre === "string" ? payload.nombre : usuario,
      perfil: perfilDe(payload.perfil),
      nivel: Number.isFinite(Number(payload.nivel)) ? Number(payload.nivel) : 0,
      serie: payload.serie == null ? null : String(payload.serie),
    };
  } catch {
    return null;
  }
}

/** Token crudo de la cookie de sesión (para reenviarlo a IA como Bearer), o null. */
export async function tokenMostrador(): Promise<string | null> {
  const jar = await cookies();
  const valor = jar.get(COOKIE_MOSTRADOR)?.value?.trim();
  return valor ? valor : null;
}

/** Sesión del vendedor a partir de la cookie, verificada localmente; null si no hay o no vale. */
export async function sesionMostrador(): Promise<SesionMostrador | null> {
  const token = await tokenMostrador();
  if (!token) return null;
  return verificarTokenMostrador(token);
}
