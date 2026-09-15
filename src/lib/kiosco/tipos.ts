import type {
  EstatusPartida,
  EstatusPedido,
  OrigenPartida,
  SucursalEntrega,
} from "@/lib/mostrador/tipos";
import { esSucursalEntrega } from "./identidad";

// Lo ÚNICO que el navegador del kiosco puede ver, y las funciones puras que lo
// recortan. El mostrador manda a su pantalla el pedido completo de IA; aquí no:
// la pantalla del kiosco está en el piso de la tienda, a la vista de cualquiera,
// y el contrato es tajante — nada de existencia exacta, costos, localización,
// clientes del padrón ni ids de pedido. Todo lo que devuelven los proxies pasa
// por estos recortes, así que si IA algún día manda de más, de aquí no sale.
//
// Tolerante a propósito con la forma de IA: `hayEnTienda` se respeta si viene,
// y si el motor todavía manda `existencia` se convierte a booleano y el número
// se tira. La pantalla nunca ve la cifra por ninguno de los dos caminos.

export interface ArticuloKiosco {
  codigo: string;
  descripcion: string;
  /** IVA incluido, precio de mostrador (sin descuentos de padrón). */
  precioConIva: number;
  hayEnTienda: boolean;
}

/** Pieza que Vico consultó en el turno, con el botón "Agregar al pedido". */
export interface PiezaDeVico extends ArticuloKiosco {
  origen: "nueva" | "usada";
  /** piezas.id_pieza de la Bodega Usado; null en nuevas. */
  idPiezaUsada: number | null;
  /** URL de la foto sellada; null si no hay. */
  foto: string | null;
}

/** Renglón del pedido tal como lo proyecta IA (`partidaParaKiosco`). */
export interface PartidaKiosco {
  /** id de la partida en el borrador: lo necesita el ± y el quitar. */
  idPartida: number;
  origen: OrigenPartida;
  codigo: string | null;
  idPiezaUsada: number | null;
  descripcion: string;
  cantidad: number;
  /** IVA incluido. */
  precioConIva: number;
  importe: number;
  /** ¿Alcanza lo que hay en tienda para lo que pidió? Nunca el número. */
  hayEnTienda: boolean;
}

/** El borrador del aparato (`pedidoParaKiosco`): piezas, total y renglones. */
export interface PedidoKiosco {
  /** Piezas (no renglones): lo que se le dice al cliente. */
  piezas: number;
  /** IVA incluido. */
  total: number;
  partidas: PartidaKiosco[];
}

/** Acuse de `POST /borrador/enviar`: lo único que sabe la pantalla del folio. */
export interface AcuseKiosco {
  folio: string;
  piezas: number;
  total: number;
}

type Crudo = Record<string, unknown>;

function esObjeto(valor: unknown): valor is Crudo {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

function numero(valor: unknown): number {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : 0;
}

function entero(valor: unknown): number | null {
  return typeof valor === "number" && Number.isInteger(valor) ? valor : null;
}

/**
 * ¿Hay pieza en la tienda? `hayEnTienda` manda; si IA todavía manda la
 * existencia, se reduce a booleano AQUÍ y el número se queda en el servidor.
 * Sin ninguno de los dos, `false`: "Sobre pedido" es la promesa segura.
 */
function hayEnTiendaDe(crudo: Crudo): boolean {
  if (typeof crudo.hayEnTienda === "boolean") return crudo.hayEnTienda;
  if (typeof crudo.existencia === "number") return crudo.existencia > 0;
  return false;
}

/** Artículo del buscador; null si no trae lo mínimo para pintarlo y agregarlo. */
export function sanearArticulo(valor: unknown): ArticuloKiosco | null {
  if (!esObjeto(valor)) return null;
  const codigo = texto(valor.codigo).trim();
  const descripcion = texto(valor.descripcion).trim();
  if (!codigo || !descripcion) return null;
  return {
    codigo,
    descripcion,
    precioConIva: numero(valor.precioConIva),
    hayEnTienda: hayEnTiendaDe(valor),
  };
}

/** Pieza mencionada por Vico; null si no trae con qué armar la partida. */
export function sanearPiezaDeVico(valor: unknown): PiezaDeVico | null {
  const base = sanearArticulo(valor);
  if (!base || !esObjeto(valor)) return null;
  const esUsada = valor.origen === "usada";
  const idPiezaUsada = entero(valor.idPiezaUsada);
  // Una usada se agrega por su id en la Bodega; sin él no hay nada que pedir.
  if (esUsada && idPiezaUsada === null) return null;
  return {
    ...base,
    origen: esUsada ? "usada" : "nueva",
    idPiezaUsada: esUsada ? idPiezaUsada : null,
    foto: typeof valor.foto === "string" && valor.foto ? valor.foto : null,
  };
}

function sanearPartida(valor: unknown): PartidaKiosco | null {
  if (!esObjeto(valor)) return null;
  // `id` y `precioUnitario` son los nombres del mostrador: se aceptan de
  // respaldo por si un motor viejo proyecta el pedido con esa forma.
  const idPartida = entero(valor.idPartida) ?? entero(valor.id);
  if (idPartida === null || idPartida <= 0) return null;
  const origen = valor.origen;
  return {
    idPartida,
    origen: origen === "usada" || origen === "sobre_pedido" ? origen : "nueva",
    codigo: typeof valor.codigo === "string" && valor.codigo ? valor.codigo : null,
    idPiezaUsada: entero(valor.idPiezaUsada),
    descripcion: texto(valor.descripcion),
    cantidad: Math.max(1, entero(valor.cantidad) ?? 1),
    precioConIva: numero(valor.precioConIva ?? valor.precioUnitario),
    importe: numero(valor.importe),
    hayEnTienda: hayEnTiendaDe(valor),
  };
}

/**
 * El borrador tal como lo ve el cliente: renglones, cantidades y total con IVA.
 * Se cae todo lo demás (id del pedido, estatus, cliente, bitácora, existencia
 * al pedir). null cuando IA dice que no hay borrador.
 */
export function sanearPedido(valor: unknown): PedidoKiosco | null {
  if (!esObjeto(valor)) return null;
  const crudas = Array.isArray(valor.partidas) ? valor.partidas : [];
  const partidas = crudas
    .map(sanearPartida)
    .filter((p): p is PartidaKiosco => p !== null);
  const piezas = entero(valor.piezas);
  return {
    partidas,
    total: numero(valor.total),
    // IA ya manda el conteo; si faltara, se suma de los renglones antes que
    // enseñarle un cero al cliente que acaba de agregar tres piezas.
    piezas: piezas !== null && piezas >= 0 ? piezas : partidas.reduce((suma, p) => suma + p.cantidad, 0),
  };
}

/** Acuse del envío; null si IA no mandó folio (sin folio no hay nada que enseñar). */
export function sanearAcuse(valor: unknown): AcuseKiosco | null {
  if (!esObjeto(valor)) return null;
  const folio = texto(valor.folio).trim();
  if (!folio) return null;
  return { folio, piezas: Math.max(0, entero(valor.piezas) ?? 0), total: numero(valor.total) };
}

/** Folio que llega por querystring al acuse; "" si no parece un folio. */
export function folioValido(valor: unknown): string {
  const folio = typeof valor === "string" ? valor.trim().toUpperCase() : "";
  return /^[A-Z0-9-]{1,20}$/.test(folio) ? folio : "";
}

// --- Los pedidos del cliente que entró con su celular ----------------------
//
// Lo que IA proyecta en `/api/kiosco/cliente/pedidos` y `/pedidos/[folio]`:
// folio, estatus, fechas, total y piezas; en el detalle, además los renglones
// y las observaciones. Nada de ids internos, eventos ni datos del POS, y aquí
// se vuelve a recortar por si el motor un día manda de más.

const ESTATUS_PEDIDO: ReadonlyArray<EstatusPedido> = [
  "borrador",
  "enviado",
  "confirmado",
  "listo",
  "entregado",
  "cancelado",
];
const ESTATUS_PARTIDA: ReadonlyArray<EstatusPartida> = [
  "pendiente",
  "confirmada",
  "sin_existencia",
  "sobre_pedido",
];

export interface PedidoDeCliente {
  folio: string;
  estatus: EstatusPedido;
  /** 'AAAA-MM-DD HH:MM:SS' tal como lo manda IA; null si no viene. */
  creadoEn: string | null;
  enviadoEn: string | null;
  /** IVA incluido, ya con su descuento. */
  total: number;
  piezas: number;
  /** Clave de sucursal; null si IA mandó una que aquí no existe. */
  sucursal: SucursalEntrega | null;
}

export interface PartidaDeCliente {
  descripcion: string;
  codigo: string | null;
  cantidad: number;
  /** IVA incluido. */
  precioUnitario: number;
  importe: number;
  estatusPartida: EstatusPartida;
}

export interface DetallePedidoDeCliente extends PedidoDeCliente {
  partidas: PartidaDeCliente[];
  observaciones: string | null;
}

function estatusPedidoDe(valor: unknown): EstatusPedido | null {
  return ESTATUS_PEDIDO.find((e) => e === valor) ?? null;
}

function estatusPartidaDe(valor: unknown): EstatusPartida {
  return ESTATUS_PARTIDA.find((e) => e === valor) ?? "pendiente";
}

function fechaDe(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim() ? valor : null;
}

/** Un pedido de la lista del cliente; null si no trae folio ni estatus reconocible. */
export function sanearPedidoDeCliente(valor: unknown): PedidoDeCliente | null {
  if (!esObjeto(valor)) return null;
  const folio = folioValido(valor.folio);
  const estatus = estatusPedidoDe(valor.estatus);
  if (!folio || !estatus) return null;
  return {
    folio,
    estatus,
    creadoEn: fechaDe(valor.creadoEn),
    enviadoEn: fechaDe(valor.enviadoEn),
    total: numero(valor.total),
    piezas: Math.max(0, entero(valor.piezas) ?? 0),
    sucursal: esSucursalEntrega(valor.sucursal) ? valor.sucursal : null,
  };
}

function sanearPartidaDeCliente(valor: unknown): PartidaDeCliente | null {
  if (!esObjeto(valor)) return null;
  const descripcion = texto(valor.descripcion).trim();
  if (!descripcion) return null;
  return {
    descripcion,
    codigo: typeof valor.codigo === "string" && valor.codigo ? valor.codigo : null,
    cantidad: Math.max(1, entero(valor.cantidad) ?? 1),
    precioUnitario: numero(valor.precioUnitario ?? valor.precioConIva),
    importe: numero(valor.importe),
    estatusPartida: estatusPartidaDe(valor.estatusPartida),
  };
}

/** El detalle de un pedido del cliente: la cabecera más renglones y observaciones. */
export function sanearDetalleDeCliente(valor: unknown): DetallePedidoDeCliente | null {
  const cabecera = sanearPedidoDeCliente(valor);
  if (!cabecera || !esObjeto(valor)) return null;
  const crudas = Array.isArray(valor.partidas) ? valor.partidas : [];
  const observaciones = texto(valor.observaciones).trim();
  return {
    ...cabecera,
    partidas: crudas.map(sanearPartidaDeCliente).filter((p): p is PartidaDeCliente => p !== null),
    observaciones: observaciones || null,
  };
}

/**
 * Lo que `POST /entrar` de IA (clientes y kiosco) devuelve del padrón tras
 * comprobar celular y contraseña; null si le falta algo. Las dos banderas se
 * leen a lo más restrictivo si no vienen: sin permiso de pedir y con la
 * contraseña por cambiar.
 */
export interface ClienteDelPadron {
  idCliente: number;
  nombre: string;
  telefono: string;
  /** Porcentaje 0-100 del padrón. */
  descuento: number;
  /** `permitir_pedido` del padrón: sin él el pedido remoto se rechaza al enviar. */
  permitirPedido: boolean;
  /** `true` mientras su contraseña siga siendo el celular. */
  passwordPorDefecto: boolean;
}

export function sanearClienteDelPadron(valor: unknown): ClienteDelPadron | null {
  if (!esObjeto(valor)) return null;
  const idCliente = entero(valor.idCliente);
  const nombre = texto(valor.nombre).trim();
  const telefono = texto(valor.telefono).replace(/\D/g, "");
  if (idCliente === null || idCliente <= 0 || !nombre || telefono.length !== 10) return null;
  return {
    idCliente,
    nombre,
    telefono,
    descuento: numero(valor.descuento),
    permitirPedido: valor.permitirPedido === true,
    passwordPorDefecto: valor.passwordPorDefecto !== false,
  };
}
