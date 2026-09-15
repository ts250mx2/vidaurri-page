import { CODIGO_CREDENCIALES, CODIGO_SESION_CLIENTE } from "@/lib/kiosco/navegador";
import type { MetodoHttp } from "@/lib/mostrador/api";
import { reenviarAClientes } from "./api";
import { borrarCookieCliente, sesionCliente } from "./sesion";

// Cuerpo común de los proxies `/api/clientes/*` de PAGE. Cada ruta hace lo
// mismo: leer la cookie del CLIENTE, negarse con 401 si no entró, reenviar a
// la ruta homónima de IA con la API key y la cabecera `X-Cliente`, y devolver
// el JSON con el status que dio IA. Antes de salir al navegador la respuesta
// pasa por el mismo RECORTE del kiosco (`lib/kiosco/reenvio.ts`): IA promete
// no mandar existencia exacta, costos ni ids internos, y este es el segundo
// candado del lado de PAGE.
//
// A diferencia del kiosco aquí solo hay UNA credencial, la del cliente, así
// que cualquier 401 se marca con `codigo: "cliente"` y el navegador vuelve a
// la pantalla de entrar.

export const ERROR_SIN_SESION = "Entra con tu celular y tu contraseña para seguir";
export const ERROR_SESION_RECHAZADA = "Tu sesión terminó; vuelve a entrar";
export const ERROR_PETICION = "No entendí la petición; inténtalo otra vez";

type Objeto = Record<string, unknown>;

export interface OpcionesProxyClientes {
  metodo: MetodoHttp;
  /** Leer el cuerpo JSON de la petición y reenviarlo; vacío cuenta como `{}`. */
  conCuerpo?: boolean;
  /** Tope de espera hacia IA; solo Vico necesita más de los 60 s por defecto. */
  tiempoMaximoMs?: number;
  /** Recorte de la respuesta `{ ok: true, ... }`; los errores pasan tal cual. */
  recortar?: (datos: Objeto) => Objeto;
}

/** Respuesta `{ ok: false, error }`, la forma única de error del área. */
export function respuestaError(status: number, error: string): Response {
  return Response.json({ ok: false, error }, { status });
}

/** 401 de la sesión del cliente: el navegador lo distingue por `codigo` y vuelve a entrar. */
export function respuestaSinSesion(error: string): Response {
  return Response.json({ ok: false, error, codigo: CODIGO_SESION_CLIENTE }, { status: 401 });
}

function esObjeto(valor: unknown): valor is Objeto {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

/** `true` si IA rechazó la cabecera `X-Cliente` (401 con `codigo: "cliente"`). */
export function iaRechazoAlCliente(status: number, datos: unknown): boolean {
  return status === 401 && esObjeto(datos) && datos.codigo === CODIGO_SESION_CLIENTE;
}

/**
 * `true` si el 401 de IA es de credenciales (celular/contraseña, o la
 * contraseña actual al cambiarla): viene SIN `codigo`, a diferencia de los
 * 401 del guardia (`api_key`, `cliente`), que sí lo traen.
 */
export function iaRechazoCredenciales(status: number, datos: unknown): boolean {
  return status === 401 && (!esObjeto(datos) || typeof datos.codigo !== "string");
}

/** 401 de credenciales mal tecleadas: el formulario lo enseña y no sale a ninguna parte. */
export function respuestaCredenciales(error: string): Response {
  return Response.json({ ok: false, error, codigo: CODIGO_CREDENCIALES }, { status: 401 });
}

/** Cuerpo JSON de la petición; vacío es `{}`, cualquier otra cosa se rechaza. */
export async function leerCuerpo(request: Request): Promise<{ ok: true; datos: Objeto } | { ok: false }> {
  const texto = await request.text().catch(() => null);
  if (texto === null) return { ok: false };
  if (!texto.trim()) return { ok: true, datos: {} };
  try {
    const datos: unknown = JSON.parse(texto);
    if (!esObjeto(datos)) return { ok: false };
    return { ok: true, datos };
  } catch {
    return { ok: false };
  }
}

/** Reenvía la petición a `ruta` de IA (sin el prefijo) conservando la querystring. */
export async function proxyClientes(
  request: Request,
  ruta: string,
  opciones: OpcionesProxyClientes
): Promise<Response> {
  const sesion = await sesionCliente();
  if (!sesion) return respuestaSinSesion(ERROR_SIN_SESION);

  let cuerpo: unknown = undefined;
  if (opciones.conCuerpo) {
    const lectura = await leerCuerpo(request);
    if (!lectura.ok) return respuestaError(400, ERROR_PETICION);
    cuerpo = lectura.datos;
  }

  const { search } = new URL(request.url);
  const { status, datos } = await reenviarAClientes(`${ruta}${search}`, {
    metodo: opciones.metodo,
    cuerpo,
    cliente: sesion.idCliente,
    tiempoMaximoMs: opciones.tiempoMaximoMs,
  });

  // IA revalida al cliente en cada llamada; si ya no está en el padrón, su
  // cookie se borra aquí mismo para que no se quede en un bucle de 401.
  if (iaRechazoAlCliente(status, datos)) {
    console.error("[clientes] IA rechazó la sesión del cliente", sesion.idCliente);
    await borrarCookieCliente();
    return respuestaSinSesion(ERROR_SESION_RECHAZADA);
  }

  const correcta = status === 200 && esObjeto(datos) && datos.ok === true;
  if (!correcta || !opciones.recortar) return Response.json(datos, { status });
  return Response.json(opciones.recortar(datos), { status });
}
