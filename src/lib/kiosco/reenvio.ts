import type { MetodoHttp } from "@/lib/mostrador/api";
import { reenviarAKiosco } from "./api";
import { cabeceraKiosco, sesionKiosco } from "./sesion";
import {
  sanearAcuse,
  sanearArticulo,
  sanearPedido,
  sanearPiezaDeVico,
  type ArticuloKiosco,
  type PiezaDeVico,
} from "./tipos";

// Cuerpo común de los proxies `/api/kiosco/*` de PAGE. Cada ruta hace lo
// mismo: leer la cookie del APARATO, negarse con 401 si no está activado,
// reenviar a la ruta homónima de IA con la API key y la cabecera `X-Kiosco`, y
// devolver el JSON con el status que dio IA.
//
// Lo que sí es distinto del mostrador: antes de salir al navegador, la
// respuesta pasa por un RECORTE. IA ya promete no mandar existencia exacta,
// costos ni localización; este es el segundo candado, del lado de PAGE, para
// que ni un motor viejo ni un cambio futuro puedan filtrar a una pantalla que
// está a la vista de todo el que pase por el mostrador.

export const ERROR_SIN_KIOSCO = "Esta computadora no está activada como kiosco";
export const ERROR_PETICION = "No entendí la petición; inténtalo otra vez";

/** Los mismos 8 que promete IA; si un día manda más, no se pinta una lista infinita. */
const MAX_PIEZAS_VICO = 8;
const MAX_FOTOS = 6;

type Objeto = Record<string, unknown>;

export interface OpcionesProxyKiosco {
  metodo: MetodoHttp;
  /** Leer el cuerpo JSON de la petición y reenviarlo; vacío cuenta como `{}`. */
  conCuerpo?: boolean;
  /** Tope de espera hacia IA; solo Vico necesita más de los 60 s por defecto. */
  tiempoMaximoMs?: number;
  /** Recorte de la respuesta `{ ok: true, ... }`; los errores pasan tal cual. */
  recortar?: (datos: Objeto) => Objeto;
}

/** Respuesta `{ ok: false, error }`, la forma única de error del kiosco. */
export function respuestaError(status: number, error: string): Response {
  return Response.json({ ok: false, error }, { status });
}

function esObjeto(valor: unknown): valor is Objeto {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function arreglo(datos: Objeto, clave: string): unknown[] {
  const valor = datos[clave];
  return Array.isArray(valor) ? valor : [];
}

/** Segmento numérico de ruta ([idPartida]) como entero positivo; null si no lo es. */
export function idDeRuta(valor: string): number | null {
  if (!/^\d{1,15}$/.test(valor)) return null;
  const numero = Number(valor);
  return Number.isSafeInteger(numero) && numero > 0 ? numero : null;
}

/** Cuerpo JSON de la petición; vacío es `{}`, cualquier otra cosa se rechaza. */
async function leerCuerpo(request: Request): Promise<{ ok: true; datos: unknown } | { ok: false }> {
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

// --- Recortes por ruta ----------------------------------------------------

/** Buscador: código, descripción, precio con IVA y un booleano. Nada más. */
export function recorteArticulos(datos: Objeto): Objeto {
  const articulos = arreglo(datos, "articulos")
    .map(sanearArticulo)
    .filter((a): a is ArticuloKiosco => a !== null);
  return { ok: true, articulos };
}

/** Borrador: renglones, cantidades y totales; ni id de pedido ni cliente. */
export function recortePedido(datos: Objeto): Objeto {
  return { ok: true, pedido: sanearPedido(datos.pedido) };
}

/** Envío: folio, piezas y total; nada más, como pide el contrato. */
export function recorteAcuse(datos: Objeto): Objeto {
  const acuse = sanearAcuse(datos);
  return acuse ? { ok: true, ...acuse } : { ok: false, error: "El pedido se mandó sin folio" };
}

/** Turno de Vico: su texto, las fotos, las piezas del turno y el borrador. */
export function recorteVico(datos: Objeto): Objeto {
  const fotos = arreglo(datos, "fotos")
    .filter(
      (f): f is { codigo: string; url: string } =>
        esObjeto(f) && typeof f.codigo === "string" && typeof f.url === "string"
    )
    .slice(0, MAX_FOTOS);
  const productos = arreglo(datos, "productos")
    .map(sanearPiezaDeVico)
    .filter((p): p is PiezaDeVico => p !== null)
    .slice(0, MAX_PIEZAS_VICO);
  return {
    ok: true,
    respuesta: typeof datos.respuesta === "string" ? datos.respuesta : "",
    fotos,
    productos,
    // `pedido` solo cuando IA lo mandó: un turno que no lo trae no debe
    // parecer un borrador vacío y borrar la tarjeta de la derecha.
    ...("pedido" in datos ? { pedido: sanearPedido(datos.pedido) } : {}),
  };
}

// --- El proxy -------------------------------------------------------------

/** Reenvía la petición a `ruta` de IA (sin el prefijo) conservando la querystring. */
export async function proxyKiosco(
  request: Request,
  ruta: string,
  opciones: OpcionesProxyKiosco
): Promise<Response> {
  const sesion = await sesionKiosco();
  if (!sesion) return respuestaError(401, ERROR_SIN_KIOSCO);

  let cuerpo: unknown = undefined;
  if (opciones.conCuerpo) {
    const lectura = await leerCuerpo(request);
    if (!lectura.ok) return respuestaError(400, ERROR_PETICION);
    cuerpo = lectura.datos;
  }

  const { search } = new URL(request.url);
  const { status, datos } = await reenviarAKiosco(`${ruta}${search}`, {
    metodo: opciones.metodo,
    cuerpo,
    kiosco: cabeceraKiosco(sesion),
    tiempoMaximoMs: opciones.tiempoMaximoMs,
  });

  const correcta = status === 200 && esObjeto(datos) && datos.ok === true;
  if (!correcta || !opciones.recortar) return Response.json(datos, { status });
  return Response.json(opciones.recortar(datos as Objeto), { status });
}
