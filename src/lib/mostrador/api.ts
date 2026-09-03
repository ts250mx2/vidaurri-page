// Puente único de vidaurri-page hacia el API del mostrador de vidaurri-ia
// (`${VENDEDOR_IA_URL}/api/mostrador/*`). PAGE no tiene base de pedidos: todo
// lo lee y lo escribe por aquí. La API key servidor→servidor va en `X-API-Key`
// y el token del vendedor en `Authorization: Bearer`; ninguna de las dos toca
// el navegador. Lo usan tanto las rutas `/api/mostrador/*` de PAGE (proxies)
// como las páginas de servidor que renderizan con datos de IA (SSR directo,
// sin pasar por HTTP propio).

const TIEMPO_MAXIMO_MS = 60_000;
const PREFIJO_MOSTRADOR = "/api/mostrador";

/**
 * Header de PETICIÓN que `src/proxy.ts` anexa con la ruta que se está
 * renderizando (`/mostrador/pedidos/12?x=1`); `datos.ts` lo lee para saber a
 * dónde volver cuando IA rechaza la sesión a media página. Vive aquí, y no en
 * el proxy, para que ningún lado importe al otro.
 */
export const HEADER_RUTA_MOSTRADOR = "x-mostrador-ruta";

export type MetodoHttp = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface OpcionesReenvio {
  metodo?: MetodoHttp;
  /** Se serializa como JSON; omítelo en GET/DELETE sin cuerpo. */
  cuerpo?: unknown;
  /** Token del vendedor (cookie `mostrador_sesion`); null solo en login. */
  token: string | null;
  /** IP del navegador del vendedor para el rate limit de IA (`x-mostrador-ip`); null si no se conoce. */
  ip?: string | null;
  /** Tope de espera; por defecto 60 s. Solo Vico (que piensa y consulta) necesita más. */
  tiempoMaximoMs?: number;
}

export interface RespuestaMostrador {
  status: number;
  /** El JSON tal cual lo devolvió IA (`{ ok, ... }`), o un `{ ok: false, error }` propio si no llegó. */
  datos: unknown;
}

function fallo(status: number, error: string): RespuestaMostrador {
  return { status, datos: { ok: false, error } };
}

/**
 * Acepta tanto "pedidos/12" como "/pedidos/12" o "/api/mostrador/pedidos/12"
 * (con querystring incluida) y devuelve la URL completa en IA. Tolerante a
 * propósito: cada proxy escribe la ruta como le quede natural.
 */
export function urlMostrador(base: string, ruta: string): string {
  const conBarra = ruta.startsWith("/") ? ruta : `/${ruta}`;
  const relativa = conBarra.startsWith(PREFIJO_MOSTRADOR)
    ? conBarra.slice(PREFIJO_MOSTRADOR.length)
    : conBarra;
  return `${base.replace(/\/+$/, "")}${PREFIJO_MOSTRADOR}${relativa}`;
}

/** Saca el `error` de una respuesta `{ ok: false, error }`; si no viene, el texto por defecto. */
export function mensajeDeError(datos: unknown, porDefecto: string): string {
  if (typeof datos === "object" && datos !== null && "error" in datos) {
    const error = (datos as { error?: unknown }).error;
    if (typeof error === "string" && error.trim()) return error;
  }
  return porDefecto;
}

/** `true` si IA respondió `{ ok: true, ... }`. */
export function respuestaOk(datos: unknown): datos is { ok: true } & Record<string, unknown> {
  return typeof datos === "object" && datos !== null && (datos as { ok?: unknown }).ok === true;
}

/**
 * Reenvía una petición al API del mostrador de IA y devuelve status + JSON.
 * Nunca lanza: configuración faltante, red caída o tiempo agotado se traducen
 * en `{ status, datos: { ok: false, error } }` para que el llamador solo lo
 * pase hacia afuera. Los fallos se loguean aquí, que es donde se sabe la causa.
 */
export async function reenviarAMostrador(
  ruta: string,
  init: OpcionesReenvio
): Promise<RespuestaMostrador> {
  const base = process.env.VENDEDOR_IA_URL;
  const apiKey = process.env.MOSTRADOR_API_KEY;
  if (!base || !apiKey) {
    console.error("[mostrador] faltan VENDEDOR_IA_URL o MOSTRADOR_API_KEY en las variables de entorno");
    return fallo(500, "El mostrador no está configurado");
  }

  const metodo = init.metodo ?? (init.cuerpo === undefined ? "GET" : "POST");
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-API-Key": apiKey,
  };
  if (init.token) headers.Authorization = `Bearer ${init.token}`;
  if (init.ip) headers["x-mostrador-ip"] = init.ip;
  if (init.cuerpo !== undefined) headers["Content-Type"] = "application/json";

  try {
    const res = await fetch(urlMostrador(base, ruta), {
      method: metodo,
      headers,
      body: init.cuerpo === undefined ? undefined : JSON.stringify(init.cuerpo),
      cache: "no-store",
      signal: AbortSignal.timeout(init.tiempoMaximoMs ?? TIEMPO_MAXIMO_MS),
    });
    const datos: unknown = await res.json().catch(() => null);
    if (datos === null) {
      console.error("[mostrador] respuesta sin JSON de IA", metodo, ruta, res.status);
      return fallo(res.ok ? 502 : res.status, "Respuesta inválida del mostrador");
    }
    return { status: res.status, datos };
  } catch (error) {
    const esTimeout = error instanceof Error && error.name === "TimeoutError";
    console.error("[mostrador] fallo llamando a IA", metodo, ruta, error);
    return esTimeout
      ? fallo(504, "El mostrador tardó demasiado en responder")
      : fallo(502, "No fue posible conectar con el mostrador");
  }
}
