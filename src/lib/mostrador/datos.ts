import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  HEADER_RUTA_MOSTRADOR,
  mensajeDeError,
  reenviarAMostrador,
  respuestaOk,
  type OpcionesReenvio,
  type RespuestaMostrador,
} from "./api";
import { tokenMostrador } from "./sesion";
import { destinoTrasLogin, RUTA_LOGIN_MOSTRADOR } from "./volver";
import type {
  ArticuloParaPedido,
  ClienteDescuento,
  EstatusPedido,
  FiltrosPedidos,
  HojaBackorder,
  HojaSurtido,
  PaginaPedidos,
  PedidoDetalle,
  PedidoResumen,
} from "./tipos";

// Lecturas del mostrador para las páginas de SERVIDOR (SSR directo contra IA,
// sin pasar por los proxies HTTP de PAGE). Solo corre en el servidor: lee la
// cookie con `cookies()` de next/headers y usa la API key. Cada función
// devuelve datos tipados o lanza un Error con mensaje legible para que la
// página lo pinte; si IA responde 401 por el token —vencido o revocado después
// de que el proxy de borde lo dejó pasar— se sale por el logout (que borra la
// cookie) hacia login en vez de fallar. Un 401 por la API key servidor→servidor
// es otra cosa: configuración rota, no sesión vencida, y se pinta como aviso.
// No hay paquete `server-only` en el proyecto: importar `next/headers` ya
// rompe en cliente, que es la misma protección.

const ERROR_LECTURA = "No fue posible leer el mostrador";
const ERROR_FORMA = "El mostrador respondió con un formato inesperado";
const ERROR_API_KEY = "El mostrador no está configurado en el servidor (API key)";
/** GET: borra la cookie y redirige a login con `volver` y `motivo=sesion` (ver esa ruta). */
const RUTA_LOGOUT_MOSTRADOR = "/api/mostrador/logout";
/** Cómo marca IA el 401 de la capa servidor→servidor; sin `codigo`, por el texto del error. */
const CODIGO_API_KEY = "api_key";
const ERROR_SERVICIO_NO_AUTORIZADO = "Servicio no autorizado";

type Objeto = Record<string, unknown>;
type OpcionesLectura = Omit<OpcionesReenvio, "token">;

/** Ruta que se está renderizando (la deja el proxy de borde en un header), acotada a /mostrador. */
async function rutaActual(): Promise<string> {
  const cabeceras = await headers();
  return destinoTrasLogin(cabeceras.get(HEADER_RUTA_MOSTRADOR));
}

/** `true` si el 401 es de la API key servidor→servidor, no del token del vendedor. */
function esFalloDeApiKey(datos: unknown): boolean {
  if (typeof datos !== "object" || datos === null) return false;
  const { codigo, error } = datos as { codigo?: unknown; error?: unknown };
  if (codigo === CODIGO_API_KEY) return true;
  return codigo === undefined && error === ERROR_SERVICIO_NO_AUTORIZADO;
}

/**
 * Reenvía con el token de la cookie. Sin token, a login; con 401 de IA por el
 * token, al logout (que borra la cookie y manda a login con vuelta a esta
 * ruta); con 401 por la API key, Error legible para que la página lo pinte:
 * redirigir ahí mandaría al vendedor a reloguearse por un problema que no es
 * suyo. `redirect()` viaja como excepción de Next: el llamador la deja pasar.
 */
async function llamar(ruta: string, opciones: OpcionesLectura): Promise<RespuestaMostrador> {
  const token = await tokenMostrador();
  if (!token) redirect(`${RUTA_LOGIN_MOSTRADOR}?volver=${encodeURIComponent(await rutaActual())}`);
  const respuesta = await reenviarAMostrador(ruta, { ...opciones, token });
  if (respuesta.status !== 401) return respuesta;
  if (esFalloDeApiKey(respuesta.datos)) {
    console.error("[mostrador] IA rechazó la API key servidor→servidor", ruta);
    throw new Error(ERROR_API_KEY);
  }
  redirect(`${RUTA_LOGOUT_MOSTRADOR}?volver=${encodeURIComponent(await rutaActual())}`);
}

/** Datos de una respuesta `{ ok: true, ... }`; cualquier otra cosa es Error legible. */
async function pedir(ruta: string, opciones: OpcionesLectura = {}): Promise<Objeto> {
  const { datos } = await llamar(ruta, opciones);
  if (!respuestaOk(datos)) throw new Error(mensajeDeError(datos, ERROR_LECTURA));
  return datos;
}

/** Igual que `pedir`, pero un 404 de IA es `null`: la página decide su notFound(). */
async function pedirONulo(ruta: string, opciones: OpcionesLectura = {}): Promise<Objeto | null> {
  const { status, datos } = await llamar(ruta, opciones);
  if (status === 404) return null;
  if (!respuestaOk(datos)) throw new Error(mensajeDeError(datos, ERROR_LECTURA));
  return datos;
}

/** Campo obligatorio de la respuesta; si IA no lo mandó, el contrato cambió y hay que enterarse. */
function campo<T>(datos: Objeto, clave: string): T {
  if (!(clave in datos)) {
    console.error("[mostrador] falta el campo en la respuesta de IA", clave, Object.keys(datos));
    throw new Error(ERROR_FORMA);
  }
  return datos[clave] as T;
}

function arreglo<T>(datos: Objeto, clave: string): T[] {
  const valor = campo<unknown>(datos, clave);
  return Array.isArray(valor) ? (valor as T[]) : [];
}

/** Querystring con solo los parámetros presentes y no vacíos; "" si no hay ninguno. */
function querystring(parametros: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor === undefined || valor === "") continue;
    sp.set(clave, String(valor));
  }
  const texto = sp.toString();
  return texto ? `?${texto}` : "";
}

/**
 * Filtros de la cola tal como los manda la página. `porPagina` viaja tal cual
 * (un número 10..1000 o la palabra "todos"): IA lo acota y responde con el
 * tamaño efectivo; sin él, IA usa 50.
 */
export type ConsultaPedidos = Partial<Omit<FiltrosPedidos, "porPagina">> & {
  porPagina?: number | "todos";
};

export interface PaginaPedidosMostrador extends PaginaPedidos {
  /** Tamaño de página EFECTIVO según IA (con "todos" es su tope, 1000). */
  porPagina: number;
}

/** Lo que IA aplica cuando no se le manda `porPagina`; también lo que se asume si no lo devuelve. */
const POR_PAGINA_SUPUESTO = 50;

/**
 * `porPagina` que IA aplicó de verdad. Si no lo manda o no es un entero
 * positivo (un motor viejo que ignora el parámetro), se asume 50 y se avisa
 * en el log: la paginación sigue cuadrando en vez de tumbar la cola entera.
 */
function porPaginaEfectivo(datos: Objeto): number {
  const valor = datos.porPagina;
  if (typeof valor === "number" && Number.isInteger(valor) && valor > 0) return valor;
  console.warn("[mostrador] IA no devolvió un porPagina válido; se asume", POR_PAGINA_SUPUESTO, valor);
  return POR_PAGINA_SUPUESTO;
}

export async function listarPedidos(filtros: ConsultaPedidos = {}): Promise<PaginaPedidosMostrador> {
  const datos = await pedir(`/pedidos${querystring(filtros)}`);
  return {
    pedidos: arreglo<PedidoResumen>(datos, "pedidos"),
    total: campo<number>(datos, "total"),
    porEstatus: campo<Record<EstatusPedido, number>>(datos, "porEstatus"),
    porPagina: porPaginaEfectivo(datos),
  };
}

/** Detalle completo del pedido; null si no existe. */
export async function obtenerPedido(id: number): Promise<PedidoDetalle | null> {
  const datos = await pedirONulo(`/pedidos/${id}`);
  return datos === null ? null : campo<PedidoDetalle>(datos, "pedido");
}

/** Hoja de surtido con la existencia releída de bdav/usadas; null si el pedido no existe. */
export async function hojaSurtido(id: number): Promise<HojaSurtido | null> {
  const datos = await pedirONulo(`/pedidos/${id}/surtido`);
  return datos === null ? null : campo<HojaSurtido>(datos, "hoja");
}

/** Hoja de back order a Aldo (renglones sobre pedido, proveedor y totales sin IVA); null si el pedido no existe. */
export async function hojaBackorder(id: number): Promise<HojaBackorder | null> {
  const datos = await pedirONulo(`/pedidos/${id}/backorder`);
  return datos === null ? null : campo<HojaBackorder>(datos, "hoja");
}

/** Borrador en curso del vendedor de la cookie; null si no tiene ninguno. */
export async function obtenerBorrador(): Promise<PedidoDetalle | null> {
  const datos = await pedir("/borrador");
  return campo<PedidoDetalle | null>(datos, "pedido");
}

/** Clientes del padrón que coinciden con la búsqueda (IA acota a 20). */
export async function buscarClientes(busqueda: string): Promise<ClienteDescuento[]> {
  const datos = await pedir(`/clientes${querystring({ busqueda })}`);
  return arreglo<ClienteDescuento>(datos, "clientes");
}

/** Artículos de bdav con el precio del cliente (o de mostrador si `idCliente` es null). */
export async function buscarArticulos(
  busqueda: string,
  idCliente: number | null
): Promise<ArticuloParaPedido[]> {
  const datos = await pedir(
    `/articulos${querystring({ busqueda, idCliente: idCliente ?? undefined })}`
  );
  return arreglo<ArticuloParaPedido>(datos, "articulos");
}
