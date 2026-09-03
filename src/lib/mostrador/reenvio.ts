import { reenviarAMostrador, type MetodoHttp } from "./api";
import { tokenMostrador, verificarTokenMostrador } from "./sesion";

// Cuerpo común de los proxies `/api/mostrador/*` de PAGE. Cada ruta hace lo
// mismo: leer la cookie del vendedor, negarse con 401 si no hay sesión válida,
// reenviar cuerpo y querystring a la ruta homónima de IA con la API key y el
// Bearer, y devolver el JSON y el status TAL CUAL. Nada de lógica de negocio
// aquí: la validación fina y los permisos los aplica IA, y sus mensajes de
// error son los que ve el vendedor.

export const ERROR_NO_AUTORIZADO = "No autorizado";
export const ERROR_PETICION = "Petición inválida";

export interface OpcionesProxy {
  metodo: MetodoHttp;
  /** Leer el cuerpo JSON de la petición y reenviarlo (POST); vacío cuenta como `{}`. */
  conCuerpo?: boolean;
  /** Tope de espera hacia IA; solo Vico necesita más de los 60 s por defecto. */
  tiempoMaximoMs?: number;
}

/** Respuesta `{ ok: false, error }` con el status dado, la forma única de error del mostrador. */
export function respuestaError(status: number, error: string): Response {
  return Response.json({ ok: false, error }, { status });
}

/**
 * IP del vendedor para el rate limit de IA, o null si no se puede saber.
 * `x-forwarded-for` lo escribe quien quiera: solo se le cree cuando hay un
 * proxy inverso de confianza enfrente (`CONFIAR_XFF=1` en .env), y entonces
 * se toma el ÚLTIMO salto, que es el que anexó ese proxy; los anteriores los
 * pudo poner el propio navegador. Sin proxy declarado no se manda IP e IA
 * limita solo por usuario, en vez de meter a toda la red en un mismo cubo
 * donde cinco errores de cualquiera bloquean el login de todo el mostrador.
 */
export function ipDe(request: Request): string | null {
  if (process.env.CONFIAR_XFF !== "1") return null;
  const saltos = (request.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((salto) => salto.trim())
    .filter(Boolean);
  return saltos.length ? saltos[saltos.length - 1] : null;
}

/** Segmento numérico de ruta ([id], [idPartida]) como entero positivo; null si no lo es. */
export function idDeRuta(valor: string): number | null {
  if (!/^\d{1,15}$/.test(valor)) return null;
  const numero = Number(valor);
  return Number.isSafeInteger(numero) && numero > 0 ? numero : null;
}

/**
 * Cuerpo JSON de la petición. Un cuerpo vacío es `{}` a propósito: rutas como
 * `borrador/enviar` tienen todos sus campos opcionales y el cliente puede
 * mandar el POST sin nada. Lo que no sea un objeto se rechaza antes de
 * molestar a IA.
 */
async function leerCuerpo(request: Request): Promise<{ ok: true; datos: unknown } | { ok: false }> {
  const texto = await request.text().catch(() => null);
  if (texto === null) return { ok: false };
  if (!texto.trim()) return { ok: true, datos: {} };
  try {
    const datos: unknown = JSON.parse(texto);
    if (typeof datos !== "object" || datos === null || Array.isArray(datos)) return { ok: false };
    return { ok: true, datos };
  } catch {
    return { ok: false };
  }
}

/** Reenvía la petición a `ruta` de IA (sin el prefijo) conservando la querystring. */
export async function proxyMostrador(
  request: Request,
  ruta: string,
  opciones: OpcionesProxy
): Promise<Response> {
  const token = await tokenMostrador();
  const sesion = token ? await verificarTokenMostrador(token) : null;
  if (!token || !sesion) return respuestaError(401, ERROR_NO_AUTORIZADO);

  let cuerpo: unknown = undefined;
  if (opciones.conCuerpo) {
    const lectura = await leerCuerpo(request);
    if (!lectura.ok) return respuestaError(400, ERROR_PETICION);
    cuerpo = lectura.datos;
  }

  const { search } = new URL(request.url);
  const { status, datos } = await reenviarAMostrador(`${ruta}${search}`, {
    metodo: opciones.metodo,
    cuerpo,
    token,
    ip: ipDe(request),
    tiempoMaximoMs: opciones.tiempoMaximoMs,
  });
  return Response.json(datos, { status });
}
