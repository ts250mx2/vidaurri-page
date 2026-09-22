"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import { FotoPieza } from "@/components/FotoPieza";
import { pesos } from "@/lib/formato";

// La pieza en grande: la foto a todo lo que dé la pantalla y, debajo, lo que
// hay que saber de ella (descripción, código, marca, precio con IVA y si la
// hay). Se abre al TOCAR la foto en el buscador, en las piezas de Vico y en
// el pedido —en el mostrador, el kiosco y el área de clientes—, nunca al
// pasar el ratón: el kiosco es táctil y el cliente va con el celular, donde
// no existe el "pasar por encima", y en la PC un visor que salta solo estorba
// al que va tecleando. `FotoAmpliable` es la foto con el botón que lo abre.
// Puede llevar una acción (Agregar), en plano: el ámbar es de enviar.

export interface PiezaVisor {
  /** URL de la foto (ya por el proxy que toque); null pinta "foto por tomar". */
  foto: string | null;
  codigo: string;
  descripcion: string;
  marca?: string | null;
  /** IVA incluido; sin él no se pinta el precio. */
  precioConIva?: number | null;
  /** "En existencia: 4", "Sobre pedido", "Pieza única"… */
  existencia?: string | null;
}

interface AccionVisor {
  texto: string;
  onClick: () => void;
  disabled?: boolean;
}

interface PropsVisor {
  pieza: PiezaVisor;
  onCerrar: () => void;
  accion?: AccionVisor;
}

export function VisorPieza({ pieza, onCerrar, accion }: PropsVisor) {
  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCerrar();
      }
    };
    // En captura: la pantalla de atrás también escucha Escape (hoja del pedido,
    // chat) y aquí el visor es lo que está encima, así que se cierra solo él.
    window.addEventListener("keydown", alTeclear, true);
    return () => window.removeEventListener("keydown", alTeclear, true);
  }, [onCerrar]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${pieza.descripcion}, en grande`}
      onClick={onCerrar}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-6"
    >
      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar"
        className="absolute right-3 top-3 flex size-12 items-center justify-center rounded-md text-white/80 transition-colors duration-150 hover:bg-white/10 hover:text-white"
      >
        <X aria-hidden className="size-7" />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className="lamina flex max-h-full w-full max-w-3xl flex-col overflow-hidden"
      >
        <FotoPieza
          src={pieza.foto}
          alt={`Foto de ${pieza.descripcion}`}
          prioritaria
          className="mesa-dibujo h-[46vh] w-full shrink-0 sm:h-[56vh]"
          imgClassName="p-3"
        />
        <div className="flex flex-col gap-3 border-t border-linea px-4 py-4 sm:flex-row sm:items-end sm:gap-6 sm:px-6">
          <div className="min-w-0 flex-1">
            <p className="num-tab font-mono text-sm text-tinta-suave">
              {pieza.codigo}
              {pieza.marca && (
                <span className="ml-2 font-sans font-semibold uppercase text-tinta">{pieza.marca}</span>
              )}
            </p>
            <p className="titulo-lamina mt-1 text-xl leading-tight text-tinta sm:text-2xl">{pieza.descripcion}</p>
            <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {typeof pieza.precioConIva === "number" && (
                <span className="num-tab titulo-lamina font-mono text-2xl text-tinta">
                  {pesos(pieza.precioConIva)}
                  <span className="ml-1.5 font-sans text-xs font-normal text-tinta-suave">IVA incluido</span>
                </span>
              )}
              {pieza.existencia && <span className="text-sm font-semibold text-tinta-suave">{pieza.existencia}</span>}
            </p>
          </div>
          {accion && (
            <button
              type="button"
              onClick={accion.onClick}
              disabled={accion.disabled}
              className="rotulo-tecnico inline-flex h-12 shrink-0 items-center justify-center rounded-lg bg-plano px-6 text-sm text-white transition-colors duration-150 hover:bg-plano-claro disabled:cursor-not-allowed disabled:opacity-50 sm:h-14 sm:text-base"
            >
              {accion.texto}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** La foto de un renglón, con el botón que la abre en grande. `className` es la caja (tamaño, borde). */
export function FotoAmpliable({
  src,
  alt,
  className,
  imgClassName,
  prioritaria,
  onAmpliar,
}: {
  src: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  prioritaria?: boolean;
  onAmpliar: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onAmpliar}
      aria-label={`Ver en grande: ${alt}`}
      title="Ver en grande"
      className={clsx(
        "shrink-0 cursor-zoom-in overflow-hidden transition-transform duration-150 hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-ambar",
        className
      )}
    >
      <FotoPieza src={src} alt={alt} prioritaria={prioritaria} className="size-full" imgClassName={imgClassName} />
    </button>
  );
}
