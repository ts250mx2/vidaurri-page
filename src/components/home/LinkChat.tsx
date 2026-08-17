"use client";

import clsx from "clsx";
import { abrirChat } from "@/components/BotonCotizar";

// CTA de texto que abre el chat de Vico (nivel navegación, sin ámbar): para
// las tarjetas donde el botón ámbar completo pesaría de más.

export function LinkChat({
  mensaje,
  className,
  children,
}: {
  /** Mensaje precargado; si termina en ": " queda en el input del chat. */
  mensaje: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => abrirChat(mensaje)}
      className={clsx(
        "inline-flex items-center gap-1.5 font-display text-sm font-bold uppercase tracking-wide text-tinta underline-offset-4 hover:underline",
        className
      )}
    >
      {children}
    </button>
  );
}
