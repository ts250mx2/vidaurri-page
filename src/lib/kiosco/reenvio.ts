import { cookies } from "next/headers";
import type { MetodoHttp } from "@/lib/mostrador/api";
import { reenviarAKiosco } from "./api";
import { CODIGO_SESION_CLIENTE } from "./navegador";
import {
  cabeceraKiosco,
  COOKIE_KIOSCO_CLIENTE,
  sesionClienteKiosco,
  sesionKiosco,
} from "./sesion";
import {
  sanearAcuse,
  sanearArticulo,
  sanearDetalleDeCliente,
  sanearPedido,
  sanearPedidoDeCliente,
  sanearPiezaDeVico,
  type ArticuloKiosco,
  type PedidoDeCliente,
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
export const ERROR_SIN_CLIENTE = "Entra con tu celular para ver tus pedidos";
export const ERROR_CLIENTE_RECHAZADO = "Tu sesión terminó; vuelve a entrar con tu celular";

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
  /** La ruta solo tiene sentido con un cliente que entró: sin su cookie, 401 `codigo: "cliente"`. */
  exigirCliente?: boolean;
}

/** Respuesta `{ ok: false, error }`, la forma única de error del kiosco. */
export function respuestaError(status: number, error: string): Response {
  return Response.json({ ok: false, error }, { status });
}

/**
 * 401 de la sesión del CLIENTE, distinto del 401 del aparato: el navegador lo
 * distingue por `codigo` y recarga el inicio en vez de mandar a activar.
 */
export function respuestaSinCliente(error: string): Response {
  return Response.json({ ok: false, error, codigo: CODIGO_SESION_CLIENTE }, { status: 401 });
}

/** Borra la cookie del cliente: al salir, y cuando IA dice que ese cliente ya no vale. */
export async function borrarCookieCliente(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_KIOSCO_CLIENTE);
}

/** `true` si IA rechazó la cabecera `X-Kiosco-Cliente` (401 con `codigo: "cliente"`). */
function iaRechazoAlCliente(status: number, datos: unknown): boolean {
  return status === 401 && esObjeto(datos) && datos.codigo === CODIGO_SESION_CLIENTE;
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

/** Lista de pedidos del cliente: solo lo que IA proyecta, y nada con id interno. */
export function recortePedidosDeCliente(datos: Objeto): Objeto {
  const pedidos = arreglo(datos, "pedidos")
    .map(sanearPedidoDeCliente)
    .filter((p): p is PedidoDeCliente => p !== null);
  return { ok: true, pedidos };
}

/** Un pedido del cliente con sus renglones; si no trae con qué pintarlo, se dice. */
export function recortePedidoDeCliente(datos: Objeto): Objeto {
  const pedido = sanearDetalleDeCliente(datos.pedido);
  return pedido ? { ok: true, pedido } : { ok: false, error: "No pude leer ese pedido" };
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
  // La sesión del cliente es opcional: con ella IA cotiza con su descuento y
  // pone el pedido a su nombre; sin ella, público general, como siempre.
  const cliente = await sesionClienteKiosco();
  if (opciones.exigirCliente && !cliente) return respuestaSinCliente(ERROR_SIN_CLIENTE);

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
    cliente: cliente?.idCliente ?? null,
    tiempoMaximoMs: opciones.tiempoMaximoMs,
  });

  // IA revalida al cliente en cada llamada; si ya no está en el padrón, su
  // cookie se borra aquí mismo para que la siguiente petición salga como
  // público general y no se quede en un bucle de 401.
  if (cliente && iaRechazoAlCliente(status, datos)) {
    console.error("[kiosco] IA rechazó la sesión del cliente", cliente.idCliente);
    await borrarCookieCliente();
    return respuestaSinCliente(ERROR_CLIENTE_RECHAZADO);
  }

  const correcta = status === 200 && esObjeto(datos) && datos.ok === true;
  if (!correcta || !opciones.recortar) return Response.json(datos, { status });
  return Response.json(opciones.recortar(datos as Objeto), { status });
}
