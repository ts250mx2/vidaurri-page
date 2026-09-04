"use client";

import { useState, type KeyboardEvent } from "react";
import { Minus, Plus } from "lucide-react";
import { CANTIDAD_MAX } from "@/lib/mostrador/reglas";

// Stepper de cantidad del mostrador (−, campo, +): botones de 44 px y campo
// ≥16px porque se opera con el pulgar en la tablet. Los botones avisan al
// instante; lo tecleado se confirma al salir del campo o con Enter, para que
// quien lo usa contra el servidor (detalle del pedido, borrador) no dispare
// una petición por cada dígito. La cantidad siempre sale acotada a [1, 99];
// las usadas no llevan stepper (son una unidad física): el padre pinta el
// sello "Pieza única" en su lugar.

export const CANTIDAD_MIN = 1;

interface PropsStepper {
  /** Para el aria-label: "Cantidad de DDNVE15". */
  etiqueta: string;
  cantidad: number;
  bloqueado: boolean;
  onCambiar: (cantidad: number) => void;
}

/** Cantidad acotada a [1, 99]; lo que no sea número cuenta como 1. */
export function acotarCantidad(cruda: number): number {
  if (!Number.isFinite(cruda)) return CANTIDAD_MIN;
  return Math.min(CANTIDAD_MAX, Math.max(CANTIDAD_MIN, Math.trunc(cruda)));
}

const CLASE_PASO =
  "flex size-11 items-center justify-center text-tinta transition-colors duration-150 hover:bg-papel disabled:cursor-not-allowed disabled:opacity-40";

export function Stepper({ etiqueta, cantidad, bloqueado, onCambiar }: PropsStepper) {
  // Texto del campo mientras se teclea; null = pintar la cantidad del padre.
  const [tecleado, setTecleado] = useState<string | null>(null);

  function confirmarTecleado() {
    if (tecleado === null) return;
    setTecleado(null);
    const siguiente = acotarCantidad(Number.parseInt(tecleado, 10));
    if (siguiente !== cantidad) onCambiar(siguiente);
  }

  function alTeclear(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key !== "Enter") return;
    evento.preventDefault();
    confirmarTecleado();
  }

  return (
    <div
      role="group"
      aria-label={etiqueta}
      className="flex shrink-0 items-center rounded-md border border-linea bg-hoja"
    >
      <button
        type="button"
        onClick={() => onCambiar(acotarCantidad(cantidad - 1))}
        disabled={bloqueado || cantidad <= CANTIDAD_MIN}
        aria-label="Una pieza menos"
        className={CLASE_PASO}
      >
        <Minus aria-hidden className="size-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={CANTIDAD_MIN}
        max={CANTIDAD_MAX}
        value={tecleado ?? cantidad}
        onChange={(e) => setTecleado(e.target.value)}
        onBlur={confirmarTecleado}
        onKeyDown={alTeclear}
        disabled={bloqueado}
        aria-label={etiqueta}
        className="num-tab h-11 w-12 border-x border-linea bg-hoja text-center font-mono text-base text-tinta outline-none focus:border-tinta disabled:opacity-60"
      />
      <button
        type="button"
        onClick={() => onCambiar(acotarCantidad(cantidad + 1))}
        disabled={bloqueado || cantidad >= CANTIDAD_MAX}
        aria-label="Una pieza más"
        className={CLASE_PASO}
      >
        <Plus aria-hidden className="size-4" />
      </button>
    </div>
  );
}
