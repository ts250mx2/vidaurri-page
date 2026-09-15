import type { MetodoHttp } from "@/lib/mostrador/api";

// Puente de vidaurri-page hacia las APIs "sin vendedor" de vidaurri-ia: el
// kiosco (`${VENDEDOR_IA_URL}/api/kiosco/*`) y el área de clientes
// (`/api/clientes/*`, en `lib/clientes/api.ts`). Mismo mecanismo
// servidor→servidor que el mostrador (`lib/mostrador/api.ts`), con UNA
// diferencia que es toda la seguridad de estas áreas: aquí no viaja ningún
// Bearer de vendedor, sino una cabecera de identidad que sale de la cookie
// que PAGE firmó (`X-Kiosco: <kiosco>|<sucursal>` en el kiosco, `X-Cliente:
// <id>` en clientes). El navegador nunca ve la API key ni elige la sucursal.

const TIEMPO_MAXIMO_MS = 60_000;
const PREFIJO_KIOSCO = "/api/kiosco";
/** Cabecera del guardia `exigirKiosco` de IA. */
export const HEADER_KIOSCO = "X-Kiosco";
/** Cabecera opcional con el id del cliente del padrón que entró con su celular. */
export const HEADER_KIOSCO_CLIENTE = "X-Kiosco-Cliente";

export interface RespuestaKiosco {
  status: number;
  /** El JSON tal cual lo devolvió IA (`{ ok, ... }`), o un `{ ok: false, error }` propio si no llegó. */
  datos: unknown;
}

export interface OpcionesReenvioIa {
  metodo?: MetodoHttp;
  /** Se serializa como JSON; omítelo en GET/DELETE sin cuerpo. */
  cuerpo?: unknown;
  /** Cabeceras de identidad del área (`X-Kiosco`, `X-Cliente`, `x-cliente-ip`…). */
  cabeceras: Record<string, string>;
  /** Tope de espera; por defecto 60 s. Solo Vico (que piensa y consulta) necesita más. */
  tiempoMaximoMs?: number;
  /** Etiqueta del área para el log y el texto de error de configuración. */
  area: string;
}

function fallo(status: number, error: string): RespuestaKiosco {
  return { status, datos: { ok: false, error } };
}

/** Acepta "articulos", "/articulos" o "<prefijo>/articulos" (con querystring). */
export function urlIa(base: string, prefijo: string, ruta: string): string {
  const conBarra = ruta.startsWith("/") ? ruta : `/${ruta}`;
  const relativa = conBarra.startsWith(prefijo) ? conBarra.slice(prefijo.length) : conBarra;
  return `${base.replace(/\/+$/, "")}${prefijo}${relativa}`;
}

/** Acepta "articulos", "/articulos" o "/api/kiosco/articulos" (con querystring). */
export function urlKiosco(base: string, ruta: string): string {
  return urlIa(base, PREFIJO_KIOSCO, ruta);
}

/**
 * Reenvía una petición a `${prefijo}${ruta}` de IA y devuelve status + JSON.
 * Nunca lanza: configuración faltante, red caída o tiempo agotado se traducen
 * en `{ ok: false, error }` legible, porque al otro lado de esta pantalla hay
 * un cliente, no un técnico.
 */
export async function reenviarAIa(
  prefijo: string,
  ruta: string,
  init: OpcionesReenvioIa
): Promise<RespuestaKiosco> {
  const base = process.env.VENDEDOR_IA_URL;
  const apiKey = process.env.MOSTRADOR_API_KEY;
  if (!base || !apiKey) {
    console.error(`[${init.area}] faltan VENDEDOR_IA_URL o MOSTRADOR_API_KEY en las variables de entorno`);
    return fallo(500, "El servicio no está configurado");
  }

  const metodo = init.metodo ?? (init.cuerpo === undefined ? "GET" : "POST");
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-API-Key": apiKey,
    ...init.cabeceras,
  };
  if (init.cuerpo !== undefined) headers["Content-Type"] = "application/json";

  try {
    const res = await fetch(urlIa(base, prefijo, ruta), {
      method: metodo,
      headers,
      body: init.cuerpo === undefined ? undefined : JSON.stringify(init.cuerpo),
      cache: "no-store",
      signal: AbortSignal.timeout(init.tiempoMaximoMs ?? TIEMPO_MAXIMO_MS),
    });
    const datos: unknown = await res.json().catch(() => null);
    if (datos === null) {
      console.error(`[${init.area}] respuesta sin JSON de IA`, metodo, ruta, res.status);
      return fallo(res.ok ? 502 : res.status, "Respuesta inválida del servidor");
    }
    return { status: res.status, datos };
  } catch (error) {
    const esTimeout = error instanceof Error && error.name === "TimeoutError";
    console.error(`[${init.area}] fallo llamando a IA`, metodo, ruta, error);
    return esTimeout
      ? fallo(504, "El servidor tardó demasiado en responder")
      : fallo(502, "No fue posible conectar con el servidor");
  }
}

export interface OpcionesReenvioKiosco {
  metodo?: MetodoHttp;
  /** Se serializa como JSON; omítelo en GET/DELETE sin cuerpo. */
  cuerpo?: unknown;
  /** `<kiosco>|<sucursal>` sacado de la cookie; sin esto IA responde 401. */
  kiosco: string;
  /**
   * id del cliente del padrón sacado de la cookie `kiosco_cliente`; con él IA
   * cotiza con su descuento y pone el pedido a su nombre. null u omitido =
   * público general, exactamente como antes de que existiera esta cabecera.
   */
  cliente?: number | null;
  /** Tope de espera; por defecto 60 s. Solo Vico (que piensa y consulta) necesita más. */
  tiempoMaximoMs?: number;
}

/** Reenvía al API del kiosco de IA con la cabecera del aparato (y la del cliente si entró). */
export async function reenviarAKiosco(
  ruta: string,
  init: OpcionesReenvioKiosco
): Promise<RespuestaKiosco> {
  const cabeceras: Record<string, string> = { [HEADER_KIOSCO]: init.kiosco };
  if (init.cliente) cabeceras[HEADER_KIOSCO_CLIENTE] = String(init.cliente);
  return reenviarAIa(PREFIJO_KIOSCO, ruta, {
    metodo: init.metodo,
    cuerpo: init.cuerpo,
    cabeceras,
    tiempoMaximoMs: init.tiempoMaximoMs,
    area: "kiosco",
  });
}
