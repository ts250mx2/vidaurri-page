"use client";

import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";
import { FotoPieza } from "@/components/FotoPieza";
import { pesos } from "@/lib/formato";
import { urlFotoNueva } from "@/lib/fotos";
import { CLASE_BOTON_PLANO_KIOSCO } from "./estilos";
import { Tecla } from "./Tecla";

// El renglón de una pieza: foto real, descripción grande, código, precio con
// IVA, el sello de existencia y UN botón para agregarla. Lo comparten el
// buscador y las piezas que Vico consultó, para que agregar se haga siempre
// igual, se haya llegado por el nombre o por la conversación.
//
// Móvil primero: a 390 px el botón baja debajo del texto y ocupa el ancho
// entero (un pulgar lo acierta); desde `sm` se pone a la derecha como en el
// kiosco. La existencia aquí es un SÍ o un NO ("En existencia" / "Sobre
// pedido"): la cifra exacta del anaquel no llega a esta pantalla.

export type FaseAgregar = "libre" | "agregando" | "agregado";

const TEXTO_AGREGAR = "Agregar";
const TEXTO_AGREGANDO = "Agregando…";
const TEXTO_AGREGADO = "Agregado ✓";

export interface PropsRenglonPieza {
  codigo: string;
  descripcion: string;
  precioConIva: number;
  hayEnTienda: boolean;
  /** URL de la foto (la sellada que mandó Vico, o la del archivo del buscador); sin ella se pide por código al proxy público. */
  foto?: string | null;
  fase: FaseAgregar;
  bloqueado: boolean;
  /** Resaltado por el teclado (el renglón que tiene el foco). */
  activo?: boolean;
  /** Se pinta la tecla Enter junto al botón: solo en la lista que navega con flechas. */
  conTeclaEnter?: boolean;
  error?: string | null;
  onAgregar: () => void;
  onFoco?: () => void;
}

function textoDelBoton(fase: FaseAgregar): string {
  if (fase === "agregando") return TEXTO_AGREGANDO;
  if (fase === "agregado") return TEXTO_AGREGADO;
  return TEXTO_AGREGAR;
}

export const RenglonPieza = forwardRef<HTMLButtonElement, PropsRenglonPieza>(
  function RenglonPieza(
    {
      codigo,
      descripcion,
      precioConIva,
      hayEnTienda,
      foto,
      fase,
      bloqueado,
      activo = false,
      conTeclaEnter = false,
      error,
      onAgregar,
      onFoco,
    },
    ref
  ) {
    const agregado = fase === "agregado";
    return (
      <li
        className={clsx(
          "grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2.5 border-l-4 px-3 py-3 transition-colors duration-150 sm:grid-cols-[auto_1fr_auto] sm:gap-4 sm:px-4",
          activo ? "border-l-ambar bg-papel" : "border-l-transparent"
        )}
      >
        <FotoPieza
          src={foto ?? urlFotoNueva(codigo)}
          alt={descripcion}
          className="mesa-dibujo size-20 shrink-0 overflow-hidden rounded-md border border-linea sm:size-24"
          imgClassName="size-full object-contain"
        />
        <div className="min-w-0">
          <p className="line-clamp-2 text-base font-semibold leading-snug text-tinta sm:text-lg">
            {descripcion}
          </p>
          <p className="num-tab mt-1 font-mono text-sm text-tinta-suave">{codigo}</p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:mt-2">
            <span className="num-tab titulo-lamina font-mono text-lg text-tinta sm:text-xl">
              {pesos(precioConIva)}
            </span>
            <span className="text-xs text-tinta-suave">IVA incluido</span>
            {hayEnTienda ? (
              <span className="sello sello-existencia">En existencia</span>
            ) : (
              <span className="sello text-plano">Sobre pedido</span>
            )}
          </p>
          {error && (
            <p role="alert" className="mt-1.5 text-sm font-semibold text-anotacion">
              {error}
            </p>
          )}
        </div>
        <div className="col-span-2 flex flex-col items-stretch gap-1.5 sm:col-span-1 sm:items-center">
          <button
            ref={ref}
            type="button"
            onClick={onAgregar}
            onFocus={onFoco}
            disabled={bloqueado || agregado}
            aria-label={`Agregar ${descripcion} a tu pedido`}
            className={twMerge(
              CLASE_BOTON_PLANO_KIOSCO,
              "w-full sm:w-40",
              agregado && "bg-existencia hover:bg-existencia disabled:opacity-100"
            )}
          >
            {textoDelBoton(fase)}
          </button>
          {conTeclaEnter && !agregado && (
            <span className="hidden text-[11px] text-tinta-suave sm:inline">
              <Tecla>Enter</Tecla> para agregar
            </span>
          )}
        </div>
      </li>
    );
  }
);
