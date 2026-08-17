"use client";

import clsx from "clsx";

// Boton "Cotizar": abre el chat de Vico con el mensaje ya preparado (la pieza
// y su codigo). Cualquier componente puede dispararlo via CustomEvent.

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
        "inline-flex items-center justify-center gap-1.5 rounded-lg bg-ambar px-4 py-3",
        "font-display text-sm font-bold uppercase tracking-wide text-grafito",
        "transition-colors duration-150 hover:bg-ambar-press hover:text-white",
        className
      )}
    >
      {children}
    </button>
  );
}
