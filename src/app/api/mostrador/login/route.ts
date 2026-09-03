import { cookies } from "next/headers";
import { mensajeDeError, reenviarAMostrador } from "@/lib/mostrador/api";
import { ipDe } from "@/lib/mostrador/reenvio";
import {
  COOKIE_MOSTRADOR,
  DURACION_SESION_MOSTRADOR_S,
  type SesionMostrador,
} from "@/lib/mostrador/sesion";

// Login del mostrador, lado PAGE. El navegador manda usuario y contraseña
// aquí; esta ruta los reenvía a IA con la API key servidor→servidor (que el
// navegador nunca ve), y si IA firma un token lo guarda en cookie httpOnly.
// Al cliente solo le regresa la sesión (nombre, perfil): el token no sale.

export const dynamic = "force-dynamic";

const USUARIO_MAX = 50;
const CLAVE_MAX = 200;
const ERROR_PETICION = "Petición inválida";

interface Credenciales {
  usuario: string;
  clave: string;
}

interface RespuestaLoginIa {
  ok: true;
  token: string;
  sesion: SesionMostrador;
}

function validarCredenciales(
  entrada: unknown
): { ok: true; datos: Credenciales } | { ok: false; error: string } {
  if (typeof entrada !== "object" || entrada === null) return { ok: false, error: ERROR_PETICION };
  const { usuario, clave } = entrada as { usuario?: unknown; clave?: unknown };
  const usuarioLimpio = typeof usuario === "string" ? usuario.trim() : "";
  const claveTexto = typeof clave === "string" ? clave : "";
  if (!usuarioLimpio || !claveTexto) {
    return { ok: false, error: "Usuario y contraseña son obligatorios" };
  }
  if (usuarioLimpio.length > USUARIO_MAX || claveTexto.length > CLAVE_MAX) {
    return { ok: false, error: "Usuario o contraseña demasiado largos" };
  }
  return { ok: true, datos: { usuario: usuarioLimpio, clave: claveTexto } };
}

function esRespuestaLogin(datos: unknown): datos is RespuestaLoginIa {
  if (typeof datos !== "object" || datos === null) return false;
  const { ok, token, sesion } = datos as { ok?: unknown; token?: unknown; sesion?: unknown };
  return ok === true && typeof token === "string" && token.length > 0 && typeof sesion === "object" && sesion !== null;
}

export async function POST(request: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return Response.json({ ok: false, error: ERROR_PETICION }, { status: 400 });
  }
  const validacion = validarCredenciales(cuerpo);
  if (!validacion.ok) {
    return Response.json({ ok: false, error: validacion.error }, { status: 400 });
  }

  const { status, datos } = await reenviarAMostrador("/login", {
    metodo: "POST",
    cuerpo: validacion.datos,
    token: null,
    ip: ipDe(request),
  });

  if (status !== 200 || !esRespuestaLogin(datos)) {
    // Un 200 con forma rara es un problema de IA, no del vendedor: 502.
    const estado = status >= 400 ? status : 502;
    return Response.json(
      { ok: false, error: mensajeDeError(datos, "No fue posible entrar") },
      { status: estado }
    );
  }

  const jar = await cookies();
  jar.set({
    name: COOKIE_MOSTRADOR,
    value: datos.token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SESION_MOSTRADOR_S,
    secure: process.env.NODE_ENV === "production",
  });

  return Response.json({ ok: true, sesion: datos.sesion });
}
