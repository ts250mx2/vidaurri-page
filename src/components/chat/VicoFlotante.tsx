"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import { AvatarChat } from "@/components/chat/AvatarChat";
import { NEGOCIO } from "@/config/negocio";

// El cascarón de Vico flotando en la esquina inferior derecha, el mismo en
// /mostrador/nuevo, en el kiosco y en el área de clientes (el sitio público
// tiene el suyo en `ChatVico`, con su hilo en sessionStorage): el lanzador es
// la cara de Vico, con el anillo ámbar del chat público, y el panel se abre
// encima de la pantalla sin quitarle sitio a nada. El chat que va adentro se
// queda MONTADO mientras está cerrado (solo se esconde): el hilo, la sesión
// de Vico y una respuesta que llegue con el panel cerrado no se pierden.
// Quién está abierto lo decide el padre: así F2 o un "pregúntale a Vico" de
// la pantalla lo abren igual que el lanzador.

interface Props {
  abierto: boolean;
  onCambiar: (abierto: boolean) => void;
  /** Invitación junto al lanzador (solo desde `md`), mientras está cerrado. */
  invitacion?: string;
  /** Ancho y alto del panel desde `md`; en móvil siempre es pantalla completa. */
  clasePanel?: string;
  /** La pantalla tiene una barra fija abajo en móvil: el lanzador sube para no taparla. */
  sobreBarraMovil?: boolean;
  children: ReactNode;
}

export function VicoFlotante({
  abierto,
  onCambiar,
  invitacion,
  clasePanel = "md:h-[680px] md:w-[440px]",
  sobreBarraMovil = false,
  children,
}: Props) {
  return (
    <>
      <div
        className={clsx(
          "fixed right-4 z-40 flex flex-row-reverse items-center gap-3 md:right-6",
          sobreBarraMovil ? "bottom-24 lg:bottom-6" : "bottom-6"
        )}
      >
        <button
          type="button"
          onClick={() => onCambiar(!abierto)}
          aria-label={abierto ? `Cerrar chat con ${NEGOCIO.asistente}` : `Abrir chat con ${NEGOCIO.asistente}`}
          aria-expanded={abierto}
          className="flex size-14 items-center justify-center rounded-full bg-plano shadow-flotante ring-2 ring-ambar transition-transform duration-150 hover:scale-105 active:scale-100"
        >
          {abierto ? <X aria-hidden className="size-6 text-white" /> : <AvatarChat lado={56} />}
        </button>
        {invitacion && !abierto && (
          <span className="hidden rounded-md border border-linea bg-hoja px-3.5 py-2 text-sm font-semibold text-tinta shadow-lamina-alta md:inline">
            {invitacion}
          </span>
        )}
      </div>

      <div
        role="dialog"
        aria-label={`Chat con ${NEGOCIO.asistente}`}
        className={clsx(
          "fixed inset-0 z-50 bg-papel",
          "md:inset-auto md:bottom-24 md:right-6 md:max-h-[calc(100vh-8rem)]",
          "md:overflow-hidden md:rounded-lg md:border md:border-linea-fuerte md:shadow-flotante",
          clasePanel,
          !abierto && "hidden"
        )}
      >
        {children}
      </div>
    </>
  );
}
