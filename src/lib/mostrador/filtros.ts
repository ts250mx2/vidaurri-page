import { esCanalPedido, esEstatusPedido, esSucursal } from "./reglas";
import type { CanalPedido, EstatusPedido, SucursalEntrega } from "./tipos";

// Filtros de la cola de pedidos: del querystring a un objeto acotado y de
// vuelta. Puro, sin base: lo usan la página de servidor (para pedir a IA y
// pintar los filtros elegidos) y la isla de filtros (para armar la URL a la
// que navega). Nunca falla: lo que no se entiende se ignora, igual que hace
// `validarFiltrosPedidos` en IA, que es quien tiene la última palabra.

export interface FiltrosCola {
  estatus?: EstatusPedido;
  sucursal?: SucursalEntrega;
  canal?: CanalPedido;
  /** Usuario del POS que capturó o atendió. */
  usuario?: string;
  /** 'AAAA-MM-DD'. */
  desde?: string;
  hasta?: string;
  /** Folio, nombre del cliente o teléfono. */
  busqueda?: string;
  pagina: number;
}

export const USUARIO_MAX = 50;
export const BUSQUEDA_MAX = 80;
const PAGINA_MAX = 10000;
const ES_FECHA = /^\d{4}-\d{2}-\d{2}$/;

type ValorQuery = string | string[] | undefined;

/** Primer valor del parámetro, recortado; "" si no viene. */
export function primero(valor: ValorQuery): string {
  return (Array.isArray(valor) ? valor[0] : valor)?.trim() ?? "";
}

function texto(valor: ValorQuery, maximo: number): string | undefined {
  const limpio = primero(valor).replace(/\s+/g, " ").slice(0, maximo);
  return limpio ? limpio : undefined;
}

function fecha(valor: ValorQuery): string | undefined {
  const limpio = primero(valor);
  return ES_FECHA.test(limpio) ? limpio : undefined;
}

function pagina(valor: ValorQuery): number {
  const numero = Number.parseInt(primero(valor) || "1", 10) || 1;
  return Math.min(PAGINA_MAX, Math.max(1, numero));
}

/** Filtros a partir de los `searchParams` de la página; las claves ausentes no se incluyen. */
export function filtrosDeQuery(sp: Record<string, ValorQuery>): FiltrosCola {
  const estatus = primero(sp.estatus);
  const sucursal = primero(sp.sucursal);
  const canal = primero(sp.canal);
  const usuario = texto(sp.usuario, USUARIO_MAX);
  const busqueda = texto(sp.busqueda, BUSQUEDA_MAX);
  const desde = fecha(sp.desde);
  const hasta = fecha(sp.hasta);
  return {
    ...(esEstatusPedido(estatus) ? { estatus } : {}),
    ...(esSucursal(sucursal) ? { sucursal } : {}),
    ...(esCanalPedido(canal) ? { canal } : {}),
    ...(usuario ? { usuario } : {}),
    ...(desde ? { desde } : {}),
    ...(hasta ? { hasta } : {}),
    ...(busqueda ? { busqueda } : {}),
    pagina: pagina(sp.pagina),
  };
}

/**
 * Querystring (sin `pagina`) con solo los filtros presentes, en el orden fijo
 * del formulario para que la misma selección dé siempre la misma URL. Sirve
 * tanto para `Paginacion` como para los enlaces de las fichas de estatus.
 */
export function queryDeFiltros(filtros: Omit<FiltrosCola, "pagina">): Record<string, string> {
  const query: Record<string, string> = {};
  if (filtros.estatus) query.estatus = filtros.estatus;
  if (filtros.sucursal) query.sucursal = filtros.sucursal;
  if (filtros.canal) query.canal = filtros.canal;
  if (filtros.usuario) query.usuario = filtros.usuario;
  if (filtros.busqueda) query.busqueda = filtros.busqueda;
  if (filtros.desde) query.desde = filtros.desde;
  if (filtros.hasta) query.hasta = filtros.hasta;
  return query;
}

/** URL de la cola con esos filtros: "/mostrador" limpio cuando no hay ninguno. */
export function urlCola(filtros: Omit<FiltrosCola, "pagina">, pagina = 1): string {
  const qs = new URLSearchParams(queryDeFiltros(filtros));
  if (pagina > 1) qs.set("pagina", String(pagina));
  const texto = qs.toString();
  return `/mostrador${texto ? `?${texto}` : ""}`;
}

/** Los mismos filtros sin la página, para armar enlaces que vuelven a la página 1. */
export function sinPagina(filtros: FiltrosCola): Omit<FiltrosCola, "pagina"> {
  const { estatus, sucursal, canal, usuario, desde, hasta, busqueda } = filtros;
  return {
    ...(estatus ? { estatus } : {}),
    ...(sucursal ? { sucursal } : {}),
    ...(canal ? { canal } : {}),
    ...(usuario ? { usuario } : {}),
    ...(desde ? { desde } : {}),
    ...(hasta ? { hasta } : {}),
    ...(busqueda ? { busqueda } : {}),
  };
}

/** Copia de los filtros con otro estatus (o sin ninguno), sin tocar el original. */
export function conEstatus(
  filtros: Omit<FiltrosCola, "pagina">,
  estatus: EstatusPedido | undefined
): Omit<FiltrosCola, "pagina"> {
  // sinPagina descarta las claves vacías, así que un estatus undefined
  // desaparece en vez de viajar como `estatus=undefined`.
  return sinPagina({ ...filtros, estatus, pagina: 1 });
}

/** true si hay algún filtro además de la página. */
export function hayFiltros(filtros: FiltrosCola): boolean {
  return Object.keys(queryDeFiltros(filtros)).length > 0;
}
