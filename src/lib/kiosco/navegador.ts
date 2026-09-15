import { AREA_KIOSCO, type ConfigArea } from "./area";
import { sanearPedido, type PedidoKiosco } from "./tipos";

// Llamadas del NAVEGADOR a los proxies de PAGE del área (`/api/kiosco/*` o
// `/api/clientes/*`, según la `ConfigArea` que se le pase). Mismo contrato que
// el del mostrador (`lib/mostrador/navegador.ts`): nunca lanza, la red caída
// es status 0 y una petición abortada es -1. Va aparte porque el prefijo es
// otro y porque un 401 aquí no es "se venció tu sesión de vendedor" sino
// "esta computadora ya no es un kiosco" o "vuelve a entrar con tu celular", y
// cada área decide a qué pantalla sale.
//
// No importa nada de servidor: este archivo se empaqueta para el navegador.

export type MetodoNavegador = "GET" | "POST" | "PATCH" | "DELETE";
export type Objeto = Record<string, unknown>;

export interface RespuestaKioscoNav {
  /** Status HTTP; 0 si la petición no salió; -1 si la abortó el propio llamador. */
  status: number;
  datos: Objeto | null;
}

export interface OpcionesLlamada {
  metodo?: MetodoNavegador;
  cuerpo?: unknown;
  signal?: AbortSignal;
}

export const STATUS_SIN_RED = 0;
export const STATUS_ABORTADA = -1;
export const ERROR_RED = "No hay conexión con el servidor; inténtalo otra vez";

function esObjeto(valor: unknown): valor is Objeto {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function esAbortada(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/** Llama a `<prefijo del área><ruta>`. Nunca lanza. */
export async function llamarArea(
  area: ConfigArea,
  ruta: string,
  init: OpcionesLlamada = {}
): Promise<RespuestaKioscoNav> {
  const metodo = init.metodo ?? (init.cuerpo === undefined ? "GET" : "POST");
  try {
    const res = await fetch(`${area.prefijoApi}${ruta}`, {
      method: metodo,
      headers: init.cuerpo === undefined ? undefined : { "Content-Type": "application/json" },
      body: init.cuerpo === undefined ? undefined : JSON.stringify(init.cuerpo),
      signal: init.signal,
    });
    const datos: unknown = await res.json().catch(() => null);
    return { status: res.status, datos: esObjeto(datos) ? datos : null };
  } catch (error) {
    if (esAbortada(error)) return { status: STATUS_ABORTADA, datos: null };
    console.error(`[${area.area}] fallo llamando al proxy`, metodo, ruta, error);
    return { status: STATUS_SIN_RED, datos: null };
  }
}

/** Llama a `/api/kiosco<ruta>`. Nunca lanza. (Atajo para lo que solo existe en el kiosco.) */
export function llamarKiosco(ruta: string, init: OpcionesLlamada = {}): Promise<RespuestaKioscoNav> {
  return llamarArea(AREA_KIOSCO, ruta, init);
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

/** `codigo` con el que el proxy avisa que el 401 es de la sesión del CLIENTE, no del aparato. */
export const CODIGO_SESION_CLIENTE = "cliente";
/**
 * `codigo` con el que los proxies de ENTRAR marcan el 401 de "celular o
 * contraseña incorrectos": es un error del formulario, no una sesión perdida,
 * y la pantalla lo enseña junto al campo en vez de salir a ninguna parte.
 */
export const CODIGO_CREDENCIALES = "credenciales";

/** `true` si el 401 es de credenciales mal tecleadas (se queda en el formulario). */
export function esErrorDeCredenciales(respuesta: RespuestaKioscoNav): boolean {
  return respuesta.status === 401 && respuesta.datos?.codigo === CODIGO_CREDENCIALES;
}

/**
 * Un 401 significa que la credencial del área ya no vale y no hay nada que
 * reintentar: se sale con una navegación completa (que relee la cookie en el
 * guardia de borde) a la pantalla que el área tenga para eso. Devuelve `true`
 * cuando ya salió, para que el llamador deje de pintar.
 *
 * En el kiosco hay dos credenciales: sin `codigo: "cliente"` es el aparato el
 * que ya no es kiosco (a activar); con él, el aparato sigue activo y es la
 * sesión del cliente la que IA rechazó (ya no está en el padrón, o venció a
 * media acción); el proxy ya borró su cookie y aquí solo se recarga el inicio
 * como público general. En el área de clientes las dos rutas son la misma:
 * volver a entrar.
 */
export function sesionPerdida(area: ConfigArea, respuesta: RespuestaKioscoNav): boolean {
  if (respuesta.status !== 401) return false;
  const esDelCliente = respuesta.datos?.codigo === CODIGO_SESION_CLIENTE;
  window.location.assign(esDelCliente ? area.rutaSinCliente : area.rutaSinSesion);
  return true;
}

/** `sesionPerdida` del kiosco, para lo que solo existe ahí (activar, salir, inactividad). */
export function kioscoDesactivado(respuesta: RespuestaKioscoNav): boolean {
  return sesionPerdida(AREA_KIOSCO, respuesta);
}

/**
 * Cierra el turno del cliente en la PC del kiosco: borra la sesión del
 * cliente (si entró con su celular) y el borrador del aparato, en una sola
 * llamada. Lo usan el acuse, la inactividad y el botón Salir; el llamador
 * decide a dónde navegar después. Nunca lanza; si falla, se loguea y se
 * sigue: dejar al siguiente cliente frente a una pantalla congelada sería peor.
 */
export async function cerrarTurno(motivo: string): Promise<void> {
  const respuesta = await llamarKiosco("/cliente/salir", { metodo: "POST", cuerpo: {} });
  if (respuesta.status !== 200) {
    console.error(`[kiosco] no se pudo cerrar el turno (${motivo})`, respuesta.status);
  }
}
