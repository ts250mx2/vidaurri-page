import type { CanalPedido, EstatusPedido, PerfilPos, SucursalEntrega } from "./tipos";

// Reglas de pedidos copiadas literal de vidaurri-ia (`src/lib/pedidos.ts`).
// Aquí solo sirven para PINTAR: qué botones de estatus mostrar a cada perfil y
// con qué sello va cada estatus. La verdad la impone vidaurri-ia en cada
// llamada con el Bearer: si esta copia se desfasa, el peor caso es un botón
// que IA rechaza con 403, nunca una transición que no debía pasar.

const TODOS: ReadonlyArray<PerfilPos> = ["Ventas", "Operaciones", "Administrador"];
const SUPERVISORES: ReadonlyArray<PerfilPos> = ["Operaciones", "Administrador"];

/**
 * Matriz de transiciones: para cada estatus de origen, a cuáles se puede pasar
 * y qué perfiles pueden hacerlo. borrador -> enviado NO está aquí a propósito:
 * lo hace quien captura (vendedor o cliente) por enviarPedido de la capa de
 * datos, sin pasar por el perfil. Cancelar un pedido que ya se confirmó o ya
 * está surtido deshace trabajo del almacén, por eso solo Operaciones y
 * Administrador. entregado y cancelado son finales.
 */
const TRANSICIONES: Readonly<
  Record<EstatusPedido, Readonly<Partial<Record<EstatusPedido, ReadonlyArray<PerfilPos>>>>>
> = {
  borrador: {},
  enviado: { confirmado: TODOS, cancelado: TODOS },
  confirmado: { listo: TODOS, cancelado: SUPERVISORES },
  listo: { entregado: TODOS, cancelado: SUPERVISORES },
  entregado: {},
  cancelado: {},
};

const ESTATUS_PEDIDO: ReadonlyArray<string> = [
  "borrador",
  "enviado",
  "confirmado",
  "listo",
  "entregado",
  "cancelado",
];
const SUCURSALES: ReadonlyArray<string> = ["matriz", "fierro"];
const CANALES: ReadonlyArray<string> = ["mostrador", "whatsapp", "web"];

// Guardas de tipo para lo que llega del querystring (mismas que en IA). Aquí
// solo deciden qué filtro pintar seleccionado; IA vuelve a validar lo suyo.
export function esEstatusPedido(x: unknown): x is EstatusPedido {
  return typeof x === "string" && ESTATUS_PEDIDO.includes(x);
}

export function esSucursal(x: unknown): x is SucursalEntrega {
  return typeof x === "string" && SUCURSALES.includes(x);
}

export function esCanalPedido(x: unknown): x is CanalPedido {
  return typeof x === "string" && CANALES.includes(x);
}

/** Transiciones válidas y quién puede hacerlas. */
export function puedeCambiarEstatus(perfil: PerfilPos, de: EstatusPedido, a: EstatusPedido): boolean {
  const permitidos = TRANSICIONES[de][a];
  return permitidos !== undefined && permitidos.includes(perfil);
}

/** El cliente solo puede echar atrás lo que el mostrador todavía no trabajó. */
export function puedeCancelarCliente(estatus: EstatusPedido): boolean {
  return estatus === "borrador" || estatus === "enviado";
}

/**
 * Un pedido se puede editar (partidas, cantidades, sucursal, observaciones)
 * mientras el mostrador no lo haya surtido: borrador, enviado y confirmado sí;
 * listo, entregado y cancelado ya no. Cualquier perfil del POS puede hacerlo;
 * IA responde 409 si esta copia se desfasó.
 */
export function puedeEditarPedido(estatus: EstatusPedido): boolean {
  return estatus === "borrador" || estatus === "enviado" || estatus === "confirmado";
}

/** Topes de captura (mismos valores que IA); aquí solo acotan en pantalla antes de viajar. */
export const CANTIDAD_MAX = 99;
export const OBSERVACIONES_MAX = 500;

/** Orden natural del flujo, para pintar botones y conteos siempre igual. */
export const ORDEN_ESTATUS: ReadonlyArray<EstatusPedido> = [
  "borrador",
  "enviado",
  "confirmado",
  "listo",
  "entregado",
  "cancelado",
];

/** Estatus a los que ese perfil puede llevar un pedido que está en `de`, en orden de flujo. */
export function transicionesPermitidas(perfil: PerfilPos, de: EstatusPedido): EstatusPedido[] {
  return ORDEN_ESTATUS.filter((a) => puedeCambiarEstatus(perfil, de, a));
}

export const ETIQUETA_ESTATUS: Readonly<Record<EstatusPedido, string>> = {
  borrador: "Borrador",
  enviado: "Enviado",
  confirmado: "Confirmado",
  listo: "Listo en sucursal",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

/**
 * Sello (`.sello` de globals.css: pastilla de contorno en currentColor) con el
 * color semántico de cada estatus, según el contrato: borrador gris, enviado
 * azul del plano, confirmado ámbar, listo verde de existencia, entregado
 * tinta, cancelado rojo de anotación.
 */
export const CLASE_SELLO_ESTATUS: Readonly<Record<EstatusPedido, string>> = {
  borrador: "sello text-tinta-suave",
  enviado: "sello text-plano",
  confirmado: "sello text-ambar",
  listo: "sello text-existencia",
  entregado: "sello text-tinta",
  cancelado: "sello text-anotacion",
};
