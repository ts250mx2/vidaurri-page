"use client";

import { Printer } from "lucide-react";

// window.print() no existe en el servidor: por eso este botón es la única
// isla cliente de la hoja de surtido. `solo-pantalla` lo quita del papel.

export function BotonImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="solo-pantalla rotulo-tecnico inline-flex h-12 items-center gap-2 rounded-md bg-ambar px-5 text-sm text-plano-hondo transition-colors duration-150 hover:bg-ambar-press active:bg-ambar-press"
    >
      <Printer aria-hidden className="size-4" />
      Imprimir
    </button>
  );
}
