import { fechaCorta, MESES_CORTOS } from "@/lib/formato";
import type {
  CanalPedido,
  EstatusPartida,
  EstatusPedido,
  OrigenPartida,
  SucursalEntrega,
} from "./tipos";

// Cómo se nombran en pantalla los códigos internos del pedido (canal, origen,
// estatus de partida, eventos de bitácora) y cómo se pinta una fecha de IA.
// Solo presentación: aquí no hay reglas, y por eso vive aparte de `reglas.ts`,
// que es copia literal del dominio de vidaurri-ia.

export const ETIQUETA_CANAL: Readonly<Record<CanalPedido, string>> = {
  mostrador: "Mostrador",
  whatsapp: "WhatsApp",
  web: "Web",
};

export const ETIQUETA_SUCURSAL: Readonly<Record<SucursalEntrega, string>> = {
  matriz: "Matriz",
  fierro: "Sucursal Fierro",
};

/** La sucursal en una palabra, para celdas angostas con icono al lado; el nombre completo va en el title. */
export const ETIQUETA_SUCURSAL_CORTA: Readonly<Record<SucursalEntrega, string>> = {
  matriz: "Matriz",
  fierro: "Fierro",
};

export const ETIQUETA_ORIGEN: Readonly<Record<OrigenPartida, string>> = {
  nueva: "Nueva",
  usada: "Usada",
  sobre_pedido: "Sobre pedido",
};

export const ETIQUETA_ESTATUS_PARTIDA: Readonly<Record<EstatusPartida, string>> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  sin_existencia: "Sin existencia",
  sobre_pedido: "Sobre pedido",
};

/** Orden en que se ofrecen en el select de confirmación por renglón. */
export const ORDEN_ESTATUS_PARTIDA: ReadonlyArray<EstatusPartida> = [
  "pendiente",
  "confirmada",
  "sin_existencia",
  "sobre_pedido",
];

/**
 * Sello (`.sello`) de cada estatus de partida: pendiente en gris, confirmada
 * en verde de existencia, sin existencia en rojo de anotación y sobre pedido
 * en azul del plano (es una promesa, no un hecho).
 */
export const CLASE_SELLO_PARTIDA: Readonly<Record<EstatusPartida, string>> = {
  pendiente: "sello text-tinta-suave",
  confirmada: "sello text-existencia",
  sin_existencia: "sello text-anotacion",
  sobre_pedido: "sello text-plano",
};

const ETIQUETA_EVENTO: Readonly<Record<string, string>> = {
  creado: "Pedido creado",
  partida_agregada: "Partida agregada",
  partida_quitada: "Partida quitada",
  sucursal: "Cambio de sucursal",
  sucursal_cambiada: "Cambio de sucursal",
  descuento_actualizado: "Descuento del cliente actualizado",
  enviado: "Enviado al mostrador",
  confirmado: "Confirmado",
  listo: "Listo en sucursal",
  entregado: "Entregado",
  cancelado: "Cancelado",
  nota: "Nota",
  partidas_confirmadas: "Existencia confirmada por renglón",
  cantidad_cambiada: "Cantidad cambiada",
  observaciones: "Observaciones actualizadas",
  cotizacion_pos: "Cotización levantada en el POS",
  cotizacion_pos_error: "Error al cotizar en el POS",
  cotizacion_pos_cancelada: "Cotización cancelada en el POS",
  backorder_pos: "Back order levantada en el POS",
  backorder_pos_simulada: "Back order simulada (el POS no se tocó)",
  backorder_pos_cancelada: "Back order cancelada en el POS",
  backorder_pos_error: "Error al crear la back order en el POS",
  backorder_pos_omitida: "Back order omitida",
};

/**
 * Por qué ya no se puede editar el pedido, para decirlo junto a la tabla en
 * solo lectura. Es la cara en pantalla de `puedeEditarPedido` (reglas.ts):
 * null mientras el pedido sigue editable.
 */
const MOTIVO_NO_EDITABLE: Readonly<Partial<Record<EstatusPedido, string>>> = {
  listo: "Ya está listo en sucursal: no se puede editar",
  entregado: "Ya se entregó: no se puede editar",
  cancelado: "Está cancelado: no se puede editar",
};

export function motivoNoEditable(estatus: EstatusPedido): string | null {
  return MOTIVO_NO_EDITABLE[estatus] ?? null;
}

/** Nombre legible del evento de bitácora; los que no se conocen salen tal cual, sin guiones. */
export function etiquetaEvento(evento: string): string {
  return ETIQUETA_EVENTO[evento] ?? evento.replace(/_/g, " ");
}

/**
 * Fecha y hora como las manda IA ('AAAA-MM-DD HH:MM:SS' en horario de
 * Monterrey, o ISO) → "02-sep-2026 · 10:31". Sin hora reconocible se queda en
 * la fecha; sin fecha válida, "" (la pantalla pinta un guion).
 */
export function fechaHora(valor: string | null | undefined): string {
  const fecha = fechaCorta(valor);
  if (!fecha) return "";
  const hora = /^\d{4}-\d{2}-\d{2}[T ](\d{2}):(\d{2})/.exec(valor ?? "");
  return hora ? `${fecha} · ${hora[1]}:${hora[2]}` : fecha;
}

/**
 * Fecha y hora sin año, para renglones angostos: "03 sep · 16:56" (o "03 sep"
 * si no trae hora). El año ya lo dice el rango de fechas de la cola; la
 * versión completa (`fechaHora`) va en el title. "" si no hay fecha válida.
 */
export function fechaHoraCorta(valor: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(valor ?? "");
  if (!m) return "";
  const mes = MESES_CORTOS[Number(m[2]) - 1];
  if (!mes || Number(m[1]) < 1990) return "";
  const fecha = `${m[3]} ${mes}`;
  return m[4] ? `${fecha} · ${m[4]}:${m[5]}` : fecha;
}

/** Teléfono nacional de 10 dígitos → "81 1234 5678"; cualquier otra cosa se deja como viene. */
export function telefonoLegible(telefono: string | null): string {
  if (!telefono) return "";
  const digitos = telefono.replace(/\D/g, "");
  if (digitos.length !== 10) return telefono;
  return `${digitos.slice(0, 2)} ${digitos.slice(2, 6)} ${digitos.slice(6)}`;
}

/** Enlace `tel:` con solo los dígitos, para marcar desde la tablet o el softphone de la PC; null si no hay número que marcar. */
export function hrefTelefono(telefono: string | null): string | null {
  if (!telefono) return null;
  const digitos = telefono.replace(/\D/g, "");
  return digitos.length >= 7 ? `tel:${digitos}` : null;
}

// --- Rango de fechas de la cola ------------------------------------------

function partesFecha(iso: string): { anio: number; mes: string; dia: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const mes = MESES_CORTOS[Number(m[2]) - 1];
  return mes ? { anio: Number(m[1]), mes, dia: Number(m[3]) } : null;
}

/**
 * El rango de la cola como se dice en el mostrador: "1–3 sep 2026",
 * "28 ago – 3 sep 2026", "28 dic 2025 – 3 ene 2026", "desde el 1 sep 2026" o
 * "hasta el 3 sep 2026". "" si no hay ninguna fecha válida.
 */
export function rangoFechasLegible(desde?: string, hasta?: string): string {
  const a = desde ? partesFecha(desde) : null;
  const b = hasta ? partesFecha(hasta) : null;
  if (a && b) {
    if (a.anio !== b.anio) return `${a.dia} ${a.mes} ${a.anio} – ${b.dia} ${b.mes} ${b.anio}`;
    if (a.mes !== b.mes) return `${a.dia} ${a.mes} – ${b.dia} ${b.mes} ${a.anio}`;
    if (a.dia !== b.dia) return `${a.dia}–${b.dia} ${a.mes} ${a.anio}`;
    return `${a.dia} ${a.mes} ${a.anio}`;
  }
  if (a) return `desde el ${a.dia} ${a.mes} ${a.anio}`;
  if (b) return `hasta el ${b.dia} ${b.mes} ${b.anio}`;
  return "";
}

// --- Cotización espejo en el POS -----------------------------------------

/**
 * Cómo se lee cada `cotizaPosEstado` (contrato B5) cuando NO hay número que
 * enseñar; con `insertada` la pantalla pinta el número y no este texto.
 */
export const ETIQUETA_COTIZA_POS: Readonly<Record<string, string>> = {
  pendiente: "Pendiente de cotizar en el POS",
  simulada: "Simulada (el POS no se tocó)",
  insertada: "Cotizada en el POS",
  omitida: "No se cotiza en el POS",
  error: "Error al cotizar en el POS",
  cancelada: "Cancelada en el POS",
};

/** Texto del estado de la cotización; uno desconocido sale tal cual, sin guiones. */
export function etiquetaCotizaPos(estado: string): string {
  return ETIQUETA_COTIZA_POS[estado] ?? estado.replace(/_/g, " ");
}

// --- Back order a Aldo en el POS -----------------------------------------

/**
 * Cómo se lee cada `bkoPosEstado` (contrato backorder). Con número la
 * pantalla lo pone al lado; la píldora va siempre, porque "insertada" y
 * "cancelada" comparten número y solo el estado los distingue.
 */
export const ETIQUETA_BKO_POS: Readonly<Record<string, string>> = {
  pendiente: "Pendiente de pedir a Aldo",
  simulada: "Simulada (el POS no se tocó)",
  insertada: "Back order en el POS",
  omitida: "Sin partidas sobre pedido",
  error: "Error al crear la back order",
  cancelada: "Back order cancelada",
};

/**
 * Sello de cada estado: insertada en verde de existencia (ya está pedida),
 * simulada en azul del plano (una promesa, como "sobre pedido"), error y
 * cancelada en rojo de anotación, lo demás en gris.
 */
const CLASE_SELLO_BKO_POS: Readonly<Record<string, string>> = {
  pendiente: "sello text-tinta-suave",
  simulada: "sello text-plano",
  insertada: "sello text-existencia",
  omitida: "sello text-tinta-suave",
  error: "sello text-anotacion",
  cancelada: "sello text-anotacion",
};

/** Texto del estado de la back order; uno desconocido sale tal cual, sin guiones. */
export function etiquetaBkoPos(estado: string): string {
  return ETIQUETA_BKO_POS[estado] ?? estado.replace(/_/g, " ");
}

/** Clases del sello del estado; uno desconocido va en gris. */
export function claseSelloBkoPos(estado: string): string {
  return CLASE_SELLO_BKO_POS[estado] ?? "sello text-tinta-suave";
}
