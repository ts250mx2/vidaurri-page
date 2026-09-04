"use client";

import { useEffect, useRef, type ReactNode, type SyntheticEvent } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

// Panel plegable de los filtros de la cola. Cerrado por defecto: lo que se
// filtró ya se ve en los chips del resumen, y las fichas de conteo por
// estatus y el formulario completo solo estorban mientras se revisa la cola
// (la búsqueda rápida queda fuera, siempre visible). Si el vendedor lo abre,
// la pestaña lo recuerda (sessionStorage) para que no se cierre en cada
// navegación; en una pestaña nueva vuelve a salir cerrado. Es un <details>
// nativo sin estado de React: el HTML del servidor sale cerrado y al montar se
// abre por DOM si la pestaña lo tenía abierto, así no hay desajuste de
// hidratación. Los hijos (fichas, formulario) se apilan con el mismo aire.

const CLAVE_ABIERTO = "mostrador.filtros.abierto";

export function PanelFiltros({ resumen, children }: { resumen: ReactNode; children: ReactNode }) {
  const panel = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(CLAVE_ABIERTO) === "1" && panel.current) panel.current.open = true;
    } catch {
      // Sin storage (modo privado, política del navegador): arranca cerrado y ya.
    }
  }, []);

  function recordar(evento: SyntheticEvent<HTMLDetailsElement>) {
    try {
      sessionStorage.setItem(CLAVE_ABIERTO, evento.currentTarget.open ? "1" : "0");
    } catch {
      // Igual: si no se puede guardar, el panel funciona en memoria.
    }
  }

  return (
    <details ref={panel} onToggle={recordar} className="lamina group">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <SlidersHorizontal aria-hidden className="size-4 shrink-0 text-tinta-suave" />
        <span className="rotulo-tecnico shrink-0 text-sm text-tinta">Filtros</span>
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">{resumen}</span>
        <ChevronDown
          aria-hidden
          className="size-4 shrink-0 text-tinta-suave transition-transform duration-150 group-open:rotate-180"
        />
      </summary>
      <div className="flex flex-col gap-4 border-t border-linea p-4">{children}</div>
    </details>
  );
}
