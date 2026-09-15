import { RUTA_KIOSCO_ACTIVAR } from "./rutas";
import { sanearPedido, type PedidoKiosco } from "./tipos";

// Llamadas del NAVEGADOR a los proxies `/api/kiosco/*`. Mismo contrato que el
// del mostrador (`lib/mostrador/navegador.ts`): nunca lanza, la red caída es
// status 0 y una petición abortada es -1. Va aparte porque el prefijo es otro
// y porque un 401 aquí no es "se venció tu sesión" sino "esta computadora ya
// no es un kiosco", y se sale a la pantalla de activación.
//
// No importa nada de servidor: este archivo se empaqueta para el navegador.

export type MetodoNavegador = "GET" | "POST" | "PATCH" | "DELETE";
export type Objeto = Record<string, unknown>;

export interface RespuestaKioscoNav {
  /** Status HTTP; 0 si la petición no salió; -1 si la abortó el propio llamador. */
  status: number;
  datos: Objeto | null;
}

export const STATUS_SIN_RED = 0;
export const STATUS_ABORTADA = -1;
export const ERROR_RED = "No hay conexión con el servidor; pídele ayuda al mostrador";

const PREFIJO_KIOSCO = "/api/kiosco";

function esObjeto(valor: unknown): valor is Objeto {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function esAbortada(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/** Llama a `/api/kiosco<ruta>`. Nunca lanza. */
export async function llamarKiosco(
  ruta: string,
  init: { metodo?: MetodoNavegador; cuerpo?: unknown; signal?: AbortSignal } = {}
): Promise<RespuestaKioscoNav> {
  const metodo = init.metodo ?? (init.cuerpo === undefined ? "GET" : "POST");
  try {
    const res = await fetch(`${PREFIJO_KIOSCO}${ruta}`, {
      method: metodo,
      headers: init.cuerpo === undefined ? undefined : { "Content-Type": "application/json" },
      body: init.cuerpo === undefined ? undefined : JSON.stringify(init.cuerpo),
      signal: init.signal,
    });
    const datos: unknown = await res.json().catch(() => null);
    return { status: res.status, datos: esObjeto(datos) ? datos : null };
  } catch (error) {
    if (esAbortada(error)) return { status: STATUS_ABORTADA, datos: null };
    console.error("[kiosco] fallo llamando al proxy", metodo, ruta, error);
    return { status: STATUS_SIN_RED, datos: null };
  }
}

/** `true` si el proxy respondió `{ ok: true, ... }`. */
export function esOk(datos: Objeto | null): datos is Objeto {
  return datos !== null && datos.ok === true;
}

/** Mensaje para el cliente: el `error` que mandó el servidor, o el de red. */
export function mensajeFallo(respuesta: RespuestaKioscoNav, porDefecto: string): string {
  if (respuesta.status === STATUS_SIN_RED) return ERROR_RED;
  const error = respuesta.datos?.error;
  return typeof error === "string" && error.trim() ? error : porDefecto;
}

/** Arreglo bajo `clave`, o vacío si no vino como arreglo. */
export function arregloDe<T>(datos: Objeto | null, clave: string): T[] {
  const valor = datos?.[clave];
  return Array.isArray(valor) ? (valor as T[]) : [];
}

/** El `pedido` de la respuesta, ya recortado por el proxy; null si no trae. */
export function pedidoDeRespuesta(datos: Objeto | null): PedidoKiosco | null {
  return datos ? sanearPedido(datos.pedido) : null;
}

/**
 * Un 401 significa que alguien sacó a esta PC del modo kiosco (o el secreto
 * cambió): no hay nada que reintentar y no hay a quién pedirle contraseña,
 * así que se va a la pantalla de activación con una navegación completa, que
 * relee la cookie en el guardia de borde. Devuelve `true` cuando ya salió.
 */
export function kioscoDesactivado(status: number): boolean {
  if (status !== 401) return false;
  window.location.assign(RUTA_KIOSCO_ACTIVAR);
  return true;
}
