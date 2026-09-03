import type { PedidoDetalle } from "./tipos";

// Llamadas del NAVEGADOR a los proxies `/api/mostrador/*` de PAGE (la parte
// cliente de /mostrador). Los proxies devuelven siempre `{ ok, ... }` con el
// status que dio IA; aquí solo se parsea y se traduce "no llegó" a un fallo
// con status 0, para que cada pantalla decida qué pintar sin repetir el
// try/catch. No importa nada de servidor (ni `api.ts`, que lee variables de
// entorno): este archivo se empaqueta para el navegador.

export type MetodoNavegador = "GET" | "POST" | "DELETE";
export type Objeto = Record<string, unknown>;

export interface RespuestaProxy {
  /** Status HTTP; 0 si la petición no salió; -1 si la abortó el propio llamador. */
  status: number;
  datos: Objeto | null;
}

export const STATUS_SIN_RED = 0;
export const STATUS_ABORTADA = -1;
export const ERROR_RED = "Sin conexión con el servidor; intenta de nuevo";

const PREFIJO_PROXY = "/api/mostrador";
/** Con GET borra la cookie y redirige a `/mostrador/login?volver=…&motivo=sesion`. */
const RUTA_LOGOUT = `${PREFIJO_PROXY}/logout`;

function esObjeto(valor: unknown): valor is Objeto {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function esAbortada(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/**
 * Llama a `/api/mostrador<ruta>`. Nunca lanza: la red caída queda como
 * status 0 y una petición abortada (búsqueda con debounce que se reemplazó)
 * como -1, para que el llamador la ignore sin pintar error.
 */
export async function llamarProxy(
  ruta: string,
  init: { metodo?: MetodoNavegador; cuerpo?: unknown; signal?: AbortSignal } = {}
): Promise<RespuestaProxy> {
  const metodo = init.metodo ?? (init.cuerpo === undefined ? "GET" : "POST");
  try {
    const res = await fetch(`${PREFIJO_PROXY}${ruta}`, {
      method: metodo,
      headers: init.cuerpo === undefined ? undefined : { "Content-Type": "application/json" },
      body: init.cuerpo === undefined ? undefined : JSON.stringify(init.cuerpo),
      signal: init.signal,
    });
    const datos: unknown = await res.json().catch(() => null);
    return { status: res.status, datos: esObjeto(datos) ? datos : null };
  } catch (error) {
    if (esAbortada(error)) return { status: STATUS_ABORTADA, datos: null };
    console.error("[mostrador] fallo llamando al proxy", metodo, ruta, error);
    return { status: STATUS_SIN_RED, datos: null };
  }
}

/** `true` si el proxy respondió `{ ok: true, ... }`. */
export function esOk(datos: Objeto | null): datos is Objeto {
  return datos !== null && datos.ok === true;
}

/** Mensaje para el vendedor: el `error` de IA si lo mandó; si no salió la petición, el de red. */
export function mensajeFallo(respuesta: RespuestaProxy, porDefecto: string): string {
  if (respuesta.status === STATUS_SIN_RED) return ERROR_RED;
  const error = respuesta.datos?.error;
  return typeof error === "string" && error.trim() ? error : porDefecto;
}

/** El `pedido` de la respuesta si viene como objeto (IA lo manda en 200 y en el 409 del borrador). */
export function pedidoDe(datos: Objeto | null): PedidoDetalle | null {
  const pedido = datos?.pedido;
  return esObjeto(pedido) ? (pedido as unknown as PedidoDetalle) : null;
}

/** Arreglo bajo `clave`, o vacío si IA no lo mandó como arreglo. */
export function arregloDe<T>(datos: Objeto | null, clave: string): T[] {
  const valor = datos?.[clave];
  return Array.isArray(valor) ? (valor as T[]) : [];
}

/**
 * Sale a login con vuelta a `volver`, pasando por el logout (GET) y no directo
 * a login: si IA dijo 401 pero el token todavía pasa la verificación local
 * (lo revocaron, o los relojes no cuadran), el proxy de borde regresaría a
 * /mostrador desde login y la pantalla volvería a pedir a IA: un bucle. El
 * logout borra la cookie en el servidor y redirige a
 * `/mostrador/login?volver=…&motivo=sesion`, que el proxy deja pasar aunque
 * quedara cookie. Una sola navegación completa a propósito (no fetch +
 * router.push): así no hay carrera entre el borrado y la carga de login, y el
 * layout y el proxy releen la cookie.
 */
function salirALogin(volver: string): void {
  const destino = new URL(RUTA_LOGOUT, window.location.origin);
  destino.searchParams.set("volver", volver);
  window.location.assign(destino.toString());
}

/**
 * Un 401 a media pantalla significa que la cookie venció o la revocaron: no
 * hay nada que reintentar, se manda a login con vuelta a `volver` (por
 * defecto la ruta actual, `window.location.pathname`). Devuelve `true` cuando
 * ya disparó la salida, para que el llamador se detenga sin pintar error.
 */
export function sesionVencida(status: number, volver?: string): boolean {
  if (status !== 401) return false;
  salirALogin(volver ?? window.location.pathname);
  return true;
}
