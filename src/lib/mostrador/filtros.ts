import { esCanalPedido, esEstatusPedido, esSucursal } from "./reglas";
import type { CanalPedido, EstatusPedido, SucursalEntrega } from "./tipos";

// Filtros de la cola de pedidos: del querystring a un objeto acotado y de
// vuelta. Puro, sin base: lo usan la página de servidor (para pedir a IA y
// pintar los filtros elegidos) y las islas (búsqueda rápida, formulario y
// selector de tamaño de página) para armar la URL a la que navegan. Nunca
// falla: lo que no se entiende se ignora, igual que hace
// `validarFiltrosPedidos` en IA, que es quien tiene la última palabra.

/**
 * Tamaño de página, con el mismo contrato que `validarFiltrosPedidos` en IA:
 * un número entre 10 y 1000 o la palabra "todos" (IA la traduce a su tope y
 * devuelve en la respuesta el tamaño EFECTIVO, que es el que usa la pantalla
 * para paginar). No es un filtro: no cuenta para "hay filtros" ni lo quita
 * "Limpiar", porque cambiar de estatus no debería devolverte a 50 por página.
 */
export type PorPagina = number | "todos";
export const POR_PAGINA_DEFECTO = 50;
const POR_PAGINA_MIN = 10;
const POR_PAGINA_MAX = 1000;
/**
 * Lo que ofrece el selector del pie de la tabla. Otro número que venga en la
 * URL (un enlace compartido con `porPagina=10`) se respeta acotado y el
 * selector lo agrega como opción, en vez de "corregirlo" en silencio.
 */
export const OPCIONES_POR_PAGINA: ReadonlyArray<PorPagina> = [25, 50, 100, "todos"];

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
  /** Tamaño de página que se pide a IA; 50 si la URL no trae `porPagina`. */
  porPagina: PorPagina;
}

/** Los filtros sin la página: lo que se conserva al paginar, buscar o cambiar de estatus. */
export type FiltrosBase = Omit<FiltrosCola, "pagina">;

/** Lo que de verdad acota la cola (la página y el tamaño de página no). */
const CLAVES_FILTRO = ["estatus", "sucursal", "canal", "usuario", "desde", "hasta", "busqueda"] as const;

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

/**
 * `porPagina` tal como viene del querystring o del select: "todos", un número
 * acotado a 10..1000, o el default (50) para cualquier otra cosa. Mismas
 * reglas que `leerPorPagina` en IA, para que la URL y la respuesta cuadren.
 */
export function porPaginaDeTexto(valor: ValorQuery): PorPagina {
  const limpio = primero(valor).toLowerCase();
  if (limpio === "todos") return "todos";
  if (!/^\d{1,4}$/.test(limpio)) return POR_PAGINA_DEFECTO;
  return Math.min(POR_PAGINA_MAX, Math.max(POR_PAGINA_MIN, Number.parseInt(limpio, 10)));
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
    porPagina: porPaginaDeTexto(sp.porPagina),
  };
}

/**
 * Querystring (sin `pagina`) con solo los filtros presentes, en el orden fijo
 * del formulario para que la misma selección dé siempre la misma URL. El
 * tamaño de página va al final y solo cuando no es el default: así
 * "/mostrador" limpio sigue siendo la URL de la cola de todos los días.
 */
export function queryDeFiltros(filtros: FiltrosBase): Record<string, string> {
  const query: Record<string, string> = {};
  if (filtros.estatus) query.estatus = filtros.estatus;
  if (filtros.sucursal) query.sucursal = filtros.sucursal;
  if (filtros.canal) query.canal = filtros.canal;
  if (filtros.usuario) query.usuario = filtros.usuario;
  if (filtros.busqueda) query.busqueda = filtros.busqueda;
  if (filtros.desde) query.desde = filtros.desde;
  if (filtros.hasta) query.hasta = filtros.hasta;
  if (filtros.porPagina !== POR_PAGINA_DEFECTO) query.porPagina = String(filtros.porPagina);
  return query;
}

/** URL de la cola con esos filtros: "/mostrador" limpio cuando no hay ninguno. */
export function urlCola(filtros: FiltrosBase, pagina = 1): string {
  const qs = new URLSearchParams(queryDeFiltros(filtros));
  if (pagina > 1) qs.set("pagina", String(pagina));
  const texto = qs.toString();
  return `/mostrador${texto ? `?${texto}` : ""}`;
}

/** "/mostrador" sin filtros pero con el mismo tamaño de página: lo que hace "Limpiar". */
export function urlSinFiltros(filtros: FiltrosBase): string {
  return urlCola({ porPagina: filtros.porPagina });
}

/** Los mismos filtros sin la página, para armar enlaces que vuelven a la página 1. */
export function sinPagina(filtros: FiltrosCola): FiltrosBase {
  const { estatus, sucursal, canal, usuario, desde, hasta, busqueda, porPagina } = filtros;
  return {
    ...(estatus ? { estatus } : {}),
    ...(sucursal ? { sucursal } : {}),
    ...(canal ? { canal } : {}),
    ...(usuario ? { usuario } : {}),
    ...(desde ? { desde } : {}),
    ...(hasta ? { hasta } : {}),
    ...(busqueda ? { busqueda } : {}),
    porPagina,
  };
}

/** Copia de los filtros con otro estatus (o sin ninguno), sin tocar el original. */
export function conEstatus(filtros: FiltrosBase, estatus: EstatusPedido | undefined): FiltrosBase {
  // sinPagina descarta las claves vacías, así que un estatus undefined
  // desaparece en vez de viajar como `estatus=undefined`.
  return sinPagina({ ...filtros, estatus, pagina: 1 });
}

/** Copia de los filtros con otra búsqueda (recortada; vacía = sin búsqueda), sin tocar el original. */
export function conBusqueda(filtros: FiltrosBase, busqueda: string | undefined): FiltrosBase {
  const limpia = busqueda?.trim().replace(/\s+/g, " ").slice(0, BUSQUEDA_MAX);
  return sinPagina({ ...filtros, busqueda: limpia || undefined, pagina: 1 });
}

/** Copia de los filtros con otro tamaño de página, sin tocar el original. */
export function conPorPagina(filtros: FiltrosBase, porPagina: PorPagina): FiltrosBase {
  return { ...filtros, porPagina };
}

/** true si hay algún filtro de verdad (la página y el tamaño de página no cuentan). */
export function hayFiltros(filtros: FiltrosBase): boolean {
  return CLAVES_FILTRO.some((clave) => Boolean(filtros[clave]));
}

// --- Fechas por defecto de la cola ---------------------------------------
// Sin fechas en la URL, la cola enseña el mes en curso: lo que el mostrador
// está trabajando. Se calcula en horario de Monterrey y no en el del servidor,
// que en la nube puede estar en UTC y "cambiar de día" seis horas antes.

const ZONA_HORARIA_NEGOCIO = "America/Monterrey";

/**
 * 'AAAA-MM-DD' del instante `ahora` visto desde Monterrey. `sv-SE` es el
 * locale cuya fecha numérica ya sale en ese orden y con guiones: no hay que
 * reordenar partes ni rellenar ceros a mano.
 */
export function fechaMonterrey(ahora: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: ZONA_HORARIA_NEGOCIO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
}

/** Del primer día del mes en curso a hoy, ambos en horario de Monterrey. Pura: recibe el reloj. */
export function rangoMesEnCurso(ahora: Date): { desde: string; hasta: string } {
  const hoy = fechaMonterrey(ahora);
  return { desde: `${hoy.slice(0, 7)}-01`, hasta: hoy };
}

/**
 * Aplica el rango por defecto SOLO cuando la URL no trae ninguna de las dos
 * fechas ni una búsqueda. Con una sola fecha se respeta tal cual: el vendedor
 * abrió el rango por ese lado a propósito y rellenar la otra se lo cerraría.
 * Con búsqueda tampoco: quien teclea un folio, un cliente o un teléfono está
 * buscando ESE pedido, sea del mes que sea; acotarlo al mes en curso lo
 * escondería sin que nada en pantalla explicara por qué. Devuelve copia.
 */
export function conFechasPorDefecto(
  filtros: FiltrosCola,
  rango: { desde: string; hasta: string }
): FiltrosCola {
  if (filtros.desde || filtros.hasta || filtros.busqueda) return filtros;
  return { ...filtros, desde: rango.desde, hasta: rango.hasta };
}
