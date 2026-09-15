import { cookies } from "next/headers";
import {
  comprobarUsuarioPos,
  puedeActivarKiosco,
  validarCredenciales,
} from "@/lib/kiosco/acceso";
import {
  claveDeKiosco,
  esSucursalEntrega,
  nombreKioscoValido,
  nombreSucursal,
} from "@/lib/kiosco/identidad";
import {
  COOKIE_KIOSCO,
  DURACION_KIOSCO_S,
  ERROR_SIN_SECRETO,
  firmarTokenKiosco,
} from "@/lib/kiosco/sesion";
import { ipDe } from "@/lib/mostrador/reenvio";

// Activación del aparato: usuario y clave del POS (que se comprueban contra
// IA) más el nombre del kiosco y la sucursal donde está parado. Si todo cuadra,
// PAGE firma su propio token de dispositivo y lo deja en la cookie
// `kiosco_dispositivo`; la sesión del vendedor NO se conserva: el kiosco no es
// de nadie, es de la máquina. Solo Administrador u Operaciones pueden hacerlo.

export const dynamic = "force-dynamic";

const ERROR_PETICION = "No entendí la petición";
const ERROR_NOMBRE = "Ponle un nombre al kiosco (3 a 40 caracteres)";
const ERROR_CLAVE = "Ese nombre no deja una clave utilizable; usa letras y números";
const ERROR_SUCURSAL = "Elige la sucursal donde está esta computadora";
const ERROR_PERFIL = "Solo un usuario de Administración u Operaciones puede activar el kiosco";

export async function POST(request: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return Response.json({ ok: false, error: ERROR_PETICION }, { status: 400 });
  }

  const credenciales = validarCredenciales(cuerpo);
  if (!credenciales.ok) {
    return Response.json({ ok: false, error: credenciales.error }, { status: 400 });
  }

  const { nombre: nombreCrudo, sucursal } = (cuerpo ?? {}) as Record<string, unknown>;
  const nombre = nombreKioscoValido(nombreCrudo);
  if (!nombre) return Response.json({ ok: false, error: ERROR_NOMBRE }, { status: 400 });
  const kiosco = claveDeKiosco(nombre);
  if (!kiosco) return Response.json({ ok: false, error: ERROR_CLAVE }, { status: 400 });
  if (!esSucursalEntrega(sucursal)) {
    return Response.json({ ok: false, error: ERROR_SUCURSAL }, { status: 400 });
  }

  const comprobacion = await comprobarUsuarioPos(credenciales.datos, ipDe(request));
  if (!comprobacion.ok) {
    return Response.json({ ok: false, error: comprobacion.error }, { status: comprobacion.status });
  }
  if (!puedeActivarKiosco(comprobacion.usuario.perfil)) {
    return Response.json({ ok: false, error: ERROR_PERFIL }, { status: 403 });
  }

  const token = await firmarTokenKiosco({ kiosco, sucursal, nombre });
  if (!token) return Response.json({ ok: false, error: ERROR_SIN_SECRETO }, { status: 500 });

  const jar = await cookies();
  jar.set({
    name: COOKIE_KIOSCO,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_KIOSCO_S,
    secure: process.env.NODE_ENV === "production",
  });

  return Response.json({ ok: true, kiosco: { nombre, sucursal: nombreSucursal(sucursal) } });
}
