"use client";

import { useId, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  conPorPagina,
  OPCIONES_POR_PAGINA,
  porPaginaDeTexto,
  urlCola,
  type FiltrosBase,
  type PorPagina,
} from "@/lib/mostrador/filtros";

// Selector "Por página" del pie de la cola. Select nativo (≥16px) que al
// cambiar navega a la página 1 con `porPagina` en la URL conservando el resto
// de filtros; la página de servidor vuelve a pedir la cola a IA con ese
// tamaño. Sin estado propio: el valor lo manda la URL y la página remonta la
// isla con `key` cuando cambia, así no hay nada que sincronizar cuando se
// pagina o se filtra desde otro lado. Si la URL trae un tamaño que no está en
// la lista (un enlace compartido con `porPagina=10`), se agrega como opción
// para que el select no mienta.

const CLASE_SELECT =
  "h-10 rounded-md border border-linea bg-papel pr-8 pl-2.5 text-base text-tinta transition-colors duration-150 hover:border-linea-fuerte focus:border-tinta disabled:opacity-60";

function etiqueta(opcion: PorPagina): string {
  return opcion === "todos" ? "Todos" : String(opcion);
}

/** Las opciones fijas más la de la URL si no es una de ellas; números ascendentes y "Todos" al final. */
function opcionesCon(actual: PorPagina): PorPagina[] {
  if (OPCIONES_POR_PAGINA.includes(actual)) return [...OPCIONES_POR_PAGINA];
  const numeros = [...OPCIONES_POR_PAGINA, actual].filter((o): o is number => typeof o === "number");
  return [...numeros.sort((a, b) => a - b), "todos"];
}

export function SelectorPorPagina({ base }: { base: FiltrosBase }) {
  const router = useRouter();
  const id = useId();
  const [navegando, iniciarNavegacion] = useTransition();

  function cambiar(evento: ChangeEvent<HTMLSelectElement>) {
    const porPagina = porPaginaDeTexto(evento.target.value);
    iniciarNavegacion(() => {
      router.push(urlCola(conPorPagina(base, porPagina)));
    });
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="rotulo-tecnico text-[11px] text-tinta-suave">
        Por página
      </label>
      <select
        id={id}
        defaultValue={String(base.porPagina)}
        onChange={cambiar}
        disabled={navegando}
        className={CLASE_SELECT}
      >
        {opcionesCon(base.porPagina).map((opcion) => (
          <option key={String(opcion)} value={String(opcion)}>
            {etiqueta(opcion)}
          </option>
        ))}
      </select>
    </div>
  );
}
