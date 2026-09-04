import { Globe, MessageCircle, Store, type LucideIcon } from "lucide-react";
import clsx from "clsx";
import { ETIQUETA_CANAL } from "@/lib/mostrador/etiquetas";
import { ETIQUETA_ESTATUS } from "@/lib/mostrador/reglas";
import type { CanalPedido, EstatusPedido, PedidoResumen } from "@/lib/mostrador/tipos";

// Chips y píldoras del mostrador. El color de cada estatus y de cada canal
// vive AQUÍ una sola vez: la cola, las fichas de conteo y el detalle lo toman
// de estas tablas en vez de repetir tiras de clases. Son componentes sin
// estado (sirven en servidor y dentro de una isla) más funciones puras para
// lo que se decide sin JSX: cuál es el último cambio de estatus, cómo se
// identifica al cliente y con qué texto.
//
// Color con oficio: fondo tintado con la opacidad del token, filete del mismo
// tono y texto OSCURO para que se lea a pleno sol; el punto sólido lleva el
// color puro y es lo que se reconoce de reojo. Ámbar solo en "confirmado"
// (el estatus que pide trabajo del almacén) y nunca como relleno sólido: el
// ámbar sólido sigue siendo de la acción.

export interface TonoEstatus {
  /** Píldora completa: fondo tintado, filete y texto oscuro. */
  pildora: string;
  /** Color puro de fondo: el punto de la píldora y la barra de la ficha. */
  punto: string;
  /** Barra lateral del renglón de la cola (`border-l-*`). */
  barra: string;
  /** Fondo tenue para la ficha activa. */
  fondo: string;
}

export const TONO_ESTATUS: Readonly<Record<EstatusPedido, TonoEstatus>> = {
  borrador: {
    pildora: "border-tinta-suave/30 bg-tinta-suave/10 text-tinta-suave",
    punto: "bg-tinta-suave",
    barra: "border-l-linea-fuerte",
    fondo: "bg-tinta-suave/10",
  },
  enviado: {
    pildora: "border-plano/25 bg-plano/10 text-plano",
    punto: "bg-plano",
    barra: "border-l-plano",
    fondo: "bg-plano/10",
  },
  confirmado: {
    pildora: "border-ambar/40 bg-ambar/15 text-oro-hondo",
    punto: "bg-ambar",
    barra: "border-l-ambar",
    fondo: "bg-ambar/15",
  },
  listo: {
    pildora: "border-existencia/35 bg-existencia/10 text-tinta",
    punto: "bg-existencia",
    barra: "border-l-existencia",
    fondo: "bg-existencia/10",
  },
  entregado: {
    pildora: "border-tinta/30 bg-tinta/10 text-tinta",
    punto: "bg-tinta",
    barra: "border-l-tinta",
    fondo: "bg-tinta/10",
  },
  cancelado: {
    pildora: "border-anotacion/30 bg-anotacion/10 text-anotacion",
    punto: "bg-anotacion",
    barra: "border-l-anotacion",
    fondo: "bg-anotacion/10",
  },
};

interface TonoCanal {
  chip: string;
  icono: string;
  Icono: LucideIcon;
}

/**
 * Mostrador en tinta de la casa (lo capturó un vendedor aquí), WhatsApp en su
 * verde y Web en el azul acero del plano: no hay otro azul en los tokens, y
 * el gris azul del plano es el que más se separa del verde y de la tinta.
 */
export const TONO_CANAL: Readonly<Record<CanalPedido, TonoCanal>> = {
  mostrador: { chip: "border-tinta/15 bg-tinta/5 text-tinta", icono: "text-tinta", Icono: Store },
  whatsapp: { chip: "border-whatsapp/40 bg-whatsapp/15 text-tinta", icono: "text-existencia", Icono: MessageCircle },
  web: { chip: "border-plano/25 bg-plano/10 text-plano", icono: "text-plano", Icono: Globe },
};

// --- Funciones puras ------------------------------------------------------

/** "Listo" a secas donde no cabe "Listo en sucursal"; el resto ya es corto. */
const ETIQUETA_ESTATUS_CORTA: Readonly<Partial<Record<EstatusPedido, string>>> = {
  listo: "Listo",
};

export function etiquetaEstatus(estatus: EstatusPedido, corta = false): string {
  return (corta && ETIQUETA_ESTATUS_CORTA[estatus]) || ETIQUETA_ESTATUS[estatus];
}

type HitosPedido = Pick<
  PedidoResumen,
  "estatus" | "creadoEn" | "enviadoEn" | "confirmadoEn" | "listoEn" | "entregadoEn" | "canceladoEn"
>;

/** Fecha del hito que corresponde al estatus actual; si IA no la mandó, la de creación. */
export function fechaUltimoCambio(pedido: HitosPedido): string {
  const hito: Readonly<Record<EstatusPedido, string | null>> = {
    borrador: pedido.creadoEn,
    enviado: pedido.enviadoEn,
    confirmado: pedido.confirmadoEn,
    listo: pedido.listoEn,
    entregado: pedido.entregadoEn,
    cancelado: pedido.canceladoEn,
  };
  return hito[pedido.estatus] ?? pedido.creadoEn;
}

export type IdentidadCliente =
  | { clase: "pos"; id: number }
  | { clase: "padron"; id: number }
  | { clase: "publico" };

/**
 * Cómo se identifica al cliente del pedido: por su ID en el POS (clientes.id
 * de bdav) si el padrón está ligado; si no, por su ID en el padrón de
 * descuentos; sin ninguno, es público general. Tolera que IA todavía no
 * mande `idClienteBdav` (llega como undefined).
 */
export function identidadCliente(pedido: Pick<PedidoResumen, "idClienteBdav" | "idCliente">): IdentidadCliente {
  if (typeof pedido.idClienteBdav === "number") return { clase: "pos", id: pedido.idClienteBdav };
  if (typeof pedido.idCliente === "number") return { clase: "padron", id: pedido.idCliente };
  return { clase: "publico" };
}

export function textoIdentidadCliente(identidad: IdentidadCliente): string {
  if (identidad.clase === "pos") return `POS #${identidad.id}`;
  if (identidad.clase === "padron") return `Padrón #${identidad.id}`;
  return "Público general";
}

/** El pedido de público general trae ese mismo texto como nombre: no hay que repetirlo debajo. */
export function esNombreGenerico(nombre: string): boolean {
  const limpio = nombre.trim().toLowerCase();
  return limpio === "público general" || limpio === "publico general";
}

/** Quién capturó el pedido; sin usuario del POS lo levantó el cliente (WhatsApp o web). */
export function textoCapturadoPor(capturadoPor: string | null): string {
  return capturadoPor?.trim() || "el cliente";
}

// --- Componentes ------------------------------------------------------------

const CLASE_CHIP =
  "inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 font-display text-[11px] font-bold uppercase leading-4 tracking-[0.06em]";

export function ChipCanal({ canal, className }: { canal: CanalPedido; className?: string }) {
  const { chip, icono, Icono } = TONO_CANAL[canal];
  return (
    <span className={clsx(CLASE_CHIP, chip, className)}>
      <Icono aria-hidden className={clsx("size-3 shrink-0", icono)} />
      {ETIQUETA_CANAL[canal]}
    </span>
  );
}

export function PildoraEstatus({
  estatus,
  corta = false,
  className,
}: {
  estatus: EstatusPedido;
  /** "Listo" en vez de "Listo en sucursal" (celdas angostas); el completo queda en el title. */
  corta?: boolean;
  className?: string;
}) {
  const tono = TONO_ESTATUS[estatus];
  const texto = etiquetaEstatus(estatus, corta);
  const completo = ETIQUETA_ESTATUS[estatus];
  return (
    <span className={clsx(CLASE_CHIP, tono.pildora, className)} title={texto === completo ? undefined : completo}>
      <span aria-hidden className={clsx("size-1.5 shrink-0 rounded-full", tono.punto)} />
      {texto}
    </span>
  );
}

/** "POS #2446" o "Padrón #12" como chip; público general como texto tenue. */
export function ChipClientePos({
  idClienteBdav,
  idCliente,
  className,
}: Pick<PedidoResumen, "idClienteBdav" | "idCliente"> & { className?: string }) {
  const identidad = identidadCliente({ idClienteBdav, idCliente });
  const texto = textoIdentidadCliente(identidad);
  if (identidad.clase === "publico") {
    return <span className={clsx("text-xs text-tinta-suave", className)}>{texto}</span>;
  }
  return (
    <span
      className={clsx(
        "num-tab inline-flex items-center whitespace-nowrap rounded border border-linea-fuerte/70 bg-papel px-1.5 py-px font-mono text-[11px] leading-4 text-tinta",
        className
      )}
      title={identidad.clase === "pos" ? "ID del cliente en el POS" : "ID en el padrón de descuentos, sin ligar al POS"}
    >
      {texto}
    </span>
  );
}
