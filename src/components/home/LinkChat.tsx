"use client";

import clsx from "clsx";
import { abrirChat } from "@/components/BotonCotizar";

// CTA de texto que abre el chat de Vico (nivel navegación, sin ámbar): para los
// renglones donde el botón ámbar completo pesaría de más. Trae su propia área
// táctil de 44px para que ninguna llamada tenga que acordarse de agregarla.

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
        "rotulo-tecnico inline-flex min-h-11 items-center gap-1.5 text-[13px] text-tinta underline-offset-4 hover:underline",
        className
      )}
    >
      {children}
    </button>
  );
}
