import { CLASE_SELLO_PARTIDA, ETIQUETA_ESTATUS_PARTIDA } from "@/lib/mostrador/etiquetas";
import type { EstatusPartida, EstatusPedido } from "@/lib/mostrador/tipos";

// Cómo le nombramos al CLIENTE el estatus de su pedido. El mostrador dice
// "Enviado" (lo mandó el cliente) o "Listo en sucursal"; al cliente le importa
// qué sigue: si ya lo vimos, si ya puede pasar por él. Los sellos son los del
// resto del kiosco: verde solo cuando hay algo listo, rojo solo si se canceló,
// y nunca ámbar, que en esta pantalla es del botón.

export const ETIQUETA_ESTATUS_CLIENTE: Readonly<Record<EstatusPedido, string>> = {
  borrador: "Sin enviar",
  enviado: "Recibido, en espera del mostrador",
  confirmado: "Confirmado, lo estamos surtiendo",
  listo: "Listo para recoger",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

/** La misma etiqueta en dos palabras, para el renglón angosto de la lista. */
export const ETIQUETA_ESTATUS_CLIENTE_CORTA: Readonly<Record<EstatusPedido, string>> = {
  borrador: "Sin enviar",
  enviado: "Recibido",
  confirmado: "Confirmado",
  listo: "Listo",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export const CLASE_SELLO_ESTATUS_CLIENTE: Readonly<Record<EstatusPedido, string>> = {
  borrador: "sello text-tinta-suave",
  enviado: "sello text-plano",
  confirmado: "sello text-tinta",
  listo: "sello sello-existencia",
  entregado: "sello text-tinta-suave",
  cancelado: "sello text-anotacion",
};

/** Renglones: las mismas cuatro etiquetas y sellos del mostrador, que ya hablan claro. */
export function etiquetaPartidaCliente(estatus: EstatusPartida): string {
  return ETIQUETA_ESTATUS_PARTIDA[estatus];
}

export function claseSelloPartidaCliente(estatus: EstatusPartida): string {
  return CLASE_SELLO_PARTIDA[estatus];
}
