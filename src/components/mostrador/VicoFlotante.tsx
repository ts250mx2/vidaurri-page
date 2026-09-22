"use client";

import { useState } from "react";
import { VicoFlotante as Cascaron } from "@/components/chat/VicoFlotante";
import { ChatMostrador, type PropsChatMostrador } from "@/components/mostrador/ChatMostrador";
import { NEGOCIO } from "@/config/negocio";

// Vico flotando en /mostrador/nuevo: el cascarón compartido (esquina inferior
// derecha, cara de Vico, panel que no se desmonta) con el chat del vendedor
// adentro. El panel es más ancho que el del sitio público porque aquí es
// herramienta de trabajo.

type Props = Omit<PropsChatMostrador, "className" | "onCerrar">;

export function VicoFlotante(props: Props) {
  const [abierto, setAbierto] = useState(false);

  return (
    <Cascaron abierto={abierto} onCambiar={setAbierto} invitacion={`Pídele las piezas a ${NEGOCIO.asistente}`}>
      <ChatMostrador {...props} className="h-full" onCerrar={() => setAbierto(false)} />
    </Cascaron>
  );
}
