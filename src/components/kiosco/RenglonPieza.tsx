"use client";

import { forwardRef } from "react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";
import { FotoPieza } from "@/components/FotoPieza";
import { pesos } from "@/lib/formato";
import { CLASE_BOTON_PLANO_KIOSCO } from "./estilos";
import { Tecla } from "./Tecla";

// El renglón de una pieza en el kiosco: foto real, descripción grande, código,
// precio con IVA, el sello de existencia y UN botón para agregarla. Lo comparten
// el buscador y las piezas que Vico consultó, para que agregar se haga siempre
// igual, se haya llegado por el nombre o por la conversación.
//
// La existencia aquí es un SÍ o un NO ("En existencia" / "Sobre pedido"): la
// cifra exacta del anaquel no sale de bdav ni llega a esta pantalla, que está
// a la vista de cualquiera que pase por el mostrador.

export type FaseAgregar = "libre" | "agregando" | "agregado";

const TEXTO_AGREGAR = "Agregar";
const TEXTO_AGREGANDO = "Agregando…";
const TEXTO_AGREGADO = "Agregado ✓";

export interface PropsRenglonPieza {
  codigo: string;
  descripcion: string;
  precioConIva: number;
  hayEnTienda: boolean;
  /** Foto ya sellada que mandó IA; sin ella se pide por código al proxy público. */
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
          "flex items-center gap-4 border-l-4 px-4 py-3 transition-colors duration-150",
          activo ? "border-l-ambar bg-papel" : "border-l-transparent"
        )}
      >
        <FotoPieza
          src={foto ?? `/api/foto?codigo=${encodeURIComponent(codigo)}`}
          alt={descripcion}
          className="mesa-dibujo size-24 shrink-0 overflow-hidden rounded-md border border-linea"
          imgClassName="size-full object-contain"
        />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-lg font-semibold leading-snug text-tinta">{descripcion}</p>
          <p className="num-tab mt-1 font-mono text-sm text-tinta-suave">{codigo}</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="num-tab titulo-lamina font-mono text-xl text-tinta">
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
        <div className="flex shrink-0 flex-col items-center gap-1.5">
          <button
            ref={ref}
            type="button"
            onClick={onAgregar}
            onFocus={onFoco}
            disabled={bloqueado || agregado}
            aria-label={`Agregar ${descripcion} a tu pedido`}
            className={twMerge(
              CLASE_BOTON_PLANO_KIOSCO,
              "w-40",
              agregado && "bg-existencia hover:bg-existencia disabled:opacity-100"
            )}
          >
            {textoDelBoton(fase)}
          </button>
          {conTeclaEnter && !agregado && (
            <span className="text-[11px] text-tinta-suave">
              <Tecla>Enter</Tecla> para agregar
            </span>
          )}
        </div>
      </li>
    );
  }
);
