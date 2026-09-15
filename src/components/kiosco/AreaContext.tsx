"use client";

import { createContext, useContext } from "react";
import { AREA_KIOSCO, configDeArea, type Area, type ConfigArea } from "@/lib/kiosco/area";

// El contexto que le dice a las pantallas compartidas (armar el pedido, Vico,
// el buscador, mis pedidos, entrar) en qué área están: el kiosco de la tienda
// o el área de clientes en su propio dispositivo. Cada layout lo provee; los
// componentes leen `useArea()` y con eso saben a qué proxy hablar, a qué
// pantalla avanzar y si enseñar atajos de teclado. Sin proveedor se asume el
// kiosco, que fue el área original: nada de lo que ya existía cambia de
// comportamiento por accidente.

const ContextoArea = createContext<ConfigArea>(AREA_KIOSCO);

export function ProveedorArea({ area, children }: { area: Area; children: React.ReactNode }) {
  return <ContextoArea.Provider value={configDeArea(area)}>{children}</ContextoArea.Provider>;
}

export function useArea(): ConfigArea {
  return useContext(ContextoArea);
}
