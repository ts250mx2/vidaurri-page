import { fechaCorta } from "@/lib/formato";
import type { CanalPedido, EstatusPartida, OrigenPartida, SucursalEntrega } from "./tipos";

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
};

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

/** Teléfono nacional de 10 dígitos → "81 1234 5678"; cualquier otra cosa se deja como viene. */
export function telefonoLegible(telefono: string | null): string {
  if (!telefono) return "";
  const digitos = telefono.replace(/\D/g, "");
  if (digitos.length !== 10) return telefono;
  return `${digitos.slice(0, 2)} ${digitos.slice(2, 6)} ${digitos.slice(6)}`;
}
