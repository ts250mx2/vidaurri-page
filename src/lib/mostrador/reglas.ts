import type {
  CanalPedido,
  EstatusPedido,
  PartidaPedido,
  PedidoResumen,
  PerfilPos,
  SucursalEntrega,
} from "./tipos";

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
const CANALES: ReadonlyArray<string> = ["mostrador", "whatsapp", "web", "kiosco"];

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

/**
 * Estatus en los que el pedido puede tener (o volver a pedir) su back order a
 * Aldo: confirmado, listo o entregado. Copia de IA (contrato backorder); aquí
 * solo decide si se pinta el reintento, IA responde 409 si se desfasó.
 */
export function puedeTenerBackorder(estatus: EstatusPedido): boolean {
  return estatus === "confirmado" || estatus === "listo" || estatus === "entregado";
}

/**
 * Piezas de ESE renglón que se pedirían a Aldo por falta de existencia
 * (copia de la regla nueva de IA, contrato back order automática): solo las
 * nuevas que nadie ha revisado (`pendiente`) y cuya existencia no alcanzaba
 * para lo que pidió el cliente. 0 en todo lo demás.
 *
 * OJO: se calcula con `existenciaAlPedir`, la existencia de CUANDO se capturó
 * el pedido, que es lo único que tiene la pantalla. Al confirmar, IA vuelve a
 * leer la existencia actual en bdav y ese número manda. Sin existencia
 * capturada (null) no se deduce nada: nunca se inventa un faltante.
 */
export function faltantePorExistencia(partida: PartidaPedido): number {
  if (partida.origen !== "nueva" || partida.estatusPartida !== "pendiente") return 0;
  if (partida.existenciaAlPedir === null) return 0;
  return Math.max(0, partida.cantidad - Math.max(0, partida.existenciaAlPedir));
}

/** Piezas (no renglones) que se pedirían a Aldo por falta de existencia al confirmar. */
export function piezasPorFaltante(partidas: PartidaPedido[]): number {
  return partidas.reduce((total, partida) => total + faltantePorExistencia(partida), 0);
}

/**
 * Partidas que PODRÍAN irse a la back order (copia de `partidasParaBackorder`
 * de IA): las que el mostrador marcó "sobre pedido" al confirmar, las que
 * nacieron sobre pedido y nadie dijo todavía que sí hay en tienda
 * (pendiente), y las nuevas pendientes cuya existencia capturada no alcanzaba.
 * Nunca usadas; nunca confirmadas ni sin existencia.
 *
 * Es una vista OPTIMISTA, no la verdad: las últimas dependen de la existencia
 * de cuando se capturó el pedido, y al confirmar IA relee bdav y decide. Aquí
 * solo sirve para saber si se pinta el panel de back order y si hay hoja que
 * imprimir.
 */
export function partidasParaBackorder(partidas: PartidaPedido[]): PartidaPedido[] {
  return partidas.filter(
    (partida) =>
      partida.origen !== "usada" &&
      (partida.estatusPartida === "sobre_pedido" ||
        (partida.origen === "sobre_pedido" && partida.estatusPartida === "pendiente") ||
        faltantePorExistencia(partida) > 0)
  );
}

/** Estados de `bkoPosEstado` que cuentan como "este pedido tiene back order" aunque no haya número. */
const ESTADOS_CON_BACKORDER: ReadonlyArray<string> = ["insertada", "simulada", "error"];

/**
 * Si el pedido tiene back order a Aldo. Copia del filtro `backorder=si` de IA
 * (`num_bko_pos IS NOT NULL OR bko_pos_estado IN (...)`). La lista de back
 * orders la pide ya filtrada; esto es el cinturón por si el motor todavía no
 * entiende el filtro y devuelve la cola entera: más vale una lista corta que
 * una pantalla que miente.
 */
export function tieneBackorder(pedido: Pick<PedidoResumen, "numBkoPos" | "bkoPosEstado">): boolean {
  if (typeof pedido.numBkoPos === "number") return true;
  return pedido.bkoPosEstado !== undefined && ESTADOS_CON_BACKORDER.includes(pedido.bkoPosEstado);
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
