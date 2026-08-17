"use client";

import clsx from "clsx";

// Boton "Cotizar": abre el chat de Vico con el mensaje ya preparado (la pieza
// y su codigo). Cualquier componente puede dispararlo via CustomEvent.
//
// Es la unica pieza ambar del catalogo: el ambar se gana, y aqui hay algo que
// tocar. El texto encima del ambar siempre va en tinta oscura, tambien en
// hover — blanco sobre ambar no llega al contraste minimo.
//
// La base va con el padding chico (y 44px de alto garantizado) a proposito:
// asi quien la usa puede AGRANDARLA desde className sin pelearse con la
// cascada de utilidades.

export const EVENTO_ABRIR_CHAT = "vico:abrir";

export function abrirChat(mensaje?: string) {
  window.dispatchEvent(
    new CustomEvent(EVENTO_ABRIR_CHAT, { detail: { mensaje } })
  );
}

export function BotonCotizar({
  mensaje,
  className,
  children = "Cotizar",
}: {
  /** Mensaje que se precarga en el chat (ej. con el codigo de la pieza). */
  mensaje?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => abrirChat(mensaje)}
      className={clsx(
        // Oro con volumen: brillo alto arriba y sombra abajo, como el metal
        // biselado de la referencia. Radio suave, nunca escuadra.
        "rotulo-tecnico inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5",
        "bg-gradient-to-b from-[#f0d97d] to-[#c9a227] text-[13px] leading-none text-plano-hondo",
        "shadow-[inset_0_1px_0_rgb(255_255_255/0.45)]",
        "transition-[filter] duration-150 hover:brightness-[1.06] active:brightness-95",
        className
      )}
    >
      {children}
    </button>
  );
}
