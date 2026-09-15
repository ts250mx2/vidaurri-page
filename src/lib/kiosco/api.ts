import type { MetodoHttp } from "@/lib/mostrador/api";

// Puente de vidaurri-page hacia el API del kiosco de vidaurri-ia
// (`${VENDEDOR_IA_URL}/api/kiosco/*`). Mismo mecanismo servidor→servidor que
// el mostrador (`lib/mostrador/api.ts`), con UNA diferencia que es toda la
// seguridad del área: aquí no viaja ningún Bearer de vendedor, sino la
// cabecera `X-Kiosco: <kiosco>|<sucursal>` que sale de la cookie del aparato.
// El navegador del cliente nunca ve la API key ni elige la sucursal.

const TIEMPO_MAXIMO_MS = 60_000;
const PREFIJO_KIOSCO = "/api/kiosco";
/** Cabecera del guardia `exigirKiosco` de IA. */
export const HEADER_KIOSCO = "X-Kiosco";

export interface OpcionesReenvioKiosco {
  metodo?: MetodoHttp;
  /** Se serializa como JSON; omítelo en GET/DELETE sin cuerpo. */
  cuerpo?: unknown;
  /** `<kiosco>|<sucursal>` sacado de la cookie; sin esto IA responde 401. */
  kiosco: string;
  /** Tope de espera; por defecto 60 s. Solo Vico (que piensa y consulta) necesita más. */
  tiempoMaximoMs?: number;
}

export interface RespuestaKiosco {
  status: number;
  /** El JSON tal cual lo devolvió IA (`{ ok, ... }`), o un `{ ok: false, error }` propio si no llegó. */
  datos: unknown;
}

function fallo(status: number, error: string): RespuestaKiosco {
  return { status, datos: { ok: false, error } };
}

/** Acepta "articulos", "/articulos" o "/api/kiosco/articulos" (con querystring). */
export function urlKiosco(base: string, ruta: string): string {
  const conBarra = ruta.startsWith("/") ? ruta : `/${ruta}`;
  const relativa = conBarra.startsWith(PREFIJO_KIOSCO)
    ? conBarra.slice(PREFIJO_KIOSCO.length)
    : conBarra;
  return `${base.replace(/\/+$/, "")}${PREFIJO_KIOSCO}${relativa}`;
}

/**
 * Reenvía una petición al API del kiosco de IA y devuelve status + JSON.
 * Nunca lanza: configuración faltante, red caída o tiempo agotado se traducen
 * en `{ ok: false, error }` legible, porque al otro lado de esta pantalla hay
 * un cliente parado en el mostrador, no un técnico.
 */
export async function reenviarAKiosco(
  ruta: string,
  init: OpcionesReenvioKiosco
): Promise<RespuestaKiosco> {
  const base = process.env.VENDEDOR_IA_URL;
  const apiKey = process.env.MOSTRADOR_API_KEY;
  if (!base || !apiKey) {
    console.error("[kiosco] faltan VENDEDOR_IA_URL o MOSTRADOR_API_KEY en las variables de entorno");
    return fallo(500, "El kiosco no está configurado");
  }

  const metodo = init.metodo ?? (init.cuerpo === undefined ? "GET" : "POST");
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-API-Key": apiKey,
    [HEADER_KIOSCO]: init.kiosco,
  };
  if (init.cuerpo !== undefined) headers["Content-Type"] = "application/json";

  try {
    const res = await fetch(urlKiosco(base, ruta), {
      method: metodo,
      headers,
      body: init.cuerpo === undefined ? undefined : JSON.stringify(init.cuerpo),
      cache: "no-store",
      signal: AbortSignal.timeout(init.tiempoMaximoMs ?? TIEMPO_MAXIMO_MS),
    });
    const datos: unknown = await res.json().catch(() => null);
    if (datos === null) {
      console.error("[kiosco] respuesta sin JSON de IA", metodo, ruta, res.status);
      return fallo(res.ok ? 502 : res.status, "Respuesta inválida del servidor");
    }
    return { status: res.status, datos };
  } catch (error) {
    const esTimeout = error instanceof Error && error.name === "TimeoutError";
    console.error("[kiosco] fallo llamando a IA", metodo, ruta, error);
    return esTimeout
      ? fallo(504, "El servidor tardó demasiado en responder")
      : fallo(502, "No fue posible conectar con el servidor");
  }
}
