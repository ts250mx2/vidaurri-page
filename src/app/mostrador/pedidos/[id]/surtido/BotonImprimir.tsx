"use client";

import { Printer } from "lucide-react";

// window.print() no existe en el servidor: por eso este botón es una isla
// cliente de la hoja de surtido. `solo-pantalla` lo quita del papel. Va en
// tinta y no en ámbar: el ámbar del mostrador es solo de "Nuevo pedido" y
// "Confirmar pedido".

export function BotonImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="solo-pantalla rotulo-tecnico inline-flex h-12 items-center gap-2 rounded-md border border-tinta bg-plano px-5 text-sm text-white transition-colors duration-150 hover:bg-plano-hondo"
    >
      <Printer aria-hidden className="size-4" />
      Imprimir
    </button>
  );
}
