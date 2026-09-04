"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { BUSQUEDA_MAX, conBusqueda, urlCola, type FiltrosBase } from "@/lib/mostrador/filtros";

// Búsqueda rápida de la cola: lo único de los filtros que se ve siempre. Un
// solo campo grande (≥16px: en iOS un campo más chico hace zoom solo) con la
// lupa dentro, botón "Buscar" (o Enter) y una X para limpiar. Al buscar navega
// a /mostrador con `busqueda=` conservando el resto de filtros de la URL y
// volviendo a la página 1; la página de servidor vuelve a pedir la cola a IA,
// así la URL es compartible y "atrás" funciona. La X vacía el campo y, si la
// URL traía una búsqueda, navega sin ella; si no, solo devuelve el foco.
// El botón va en plano, no en ámbar: el único ámbar de la pantalla es "Nuevo
// pedido". El valor inicial llega de la URL y la página remonta la isla con
// `key` cuando la URL cambia, así el campo siempre enseña lo que se está
// buscando aunque el cambio venga de un chip o de "Limpiar".

const CLASE_CAMPO =
  "h-14 w-full rounded-[0.625rem] border border-linea bg-hoja pl-12 pr-12 text-base text-tinta shadow-lamina transition-colors duration-150 placeholder:text-tinta-suave hover:border-linea-fuerte focus:border-tinta [&::-webkit-search-cancel-button]:appearance-none";

const CLASE_LIMPIAR =
  "absolute top-1/2 right-2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-md text-tinta-suave transition-colors duration-150 hover:bg-papel hover:text-tinta";

const CLASE_BOTON =
  "rotulo-tecnico inline-flex h-14 shrink-0 items-center rounded-md border border-tinta bg-plano px-6 text-sm text-white transition-colors duration-150 hover:bg-plano-hondo disabled:opacity-60";

export function BusquedaRapida({ base }: { base: FiltrosBase }) {
  const router = useRouter();
  const campo = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState(base.busqueda ?? "");
  // useTransition en vez de un booleano propio: `buscando` se apaga solo
  // cuando la navegación termina, incluso si la URL resultante es la misma.
  const [buscando, iniciarNavegacion] = useTransition();

  function navegar(busqueda: string | undefined) {
    iniciarNavegacion(() => {
      router.push(urlCola(conBusqueda(base, busqueda)));
    });
  }

  function buscar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    navegar(texto);
  }

  function limpiar() {
    setTexto("");
    if (base.busqueda) navegar(undefined);
    else campo.current?.focus();
  }

  return (
    <form role="search" aria-label="Búsqueda rápida de pedidos" onSubmit={buscar} className="flex gap-2">
      <div className="relative min-w-0 flex-1">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-tinta-suave"
        />
        <input
          ref={campo}
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por folio, cliente o teléfono…"
          aria-label="Buscar por folio, cliente o teléfono"
          maxLength={BUSQUEDA_MAX}
          autoComplete="off"
          enterKeyHint="search"
          className={CLASE_CAMPO}
        />
        {texto && (
          <button type="button" onClick={limpiar} aria-label="Limpiar búsqueda" title="Limpiar" className={CLASE_LIMPIAR}>
            <X aria-hidden className="size-5" />
          </button>
        )}
      </div>
      <button type="submit" disabled={buscando} className={CLASE_BOTON}>
        {buscando ? "Buscando…" : "Buscar"}
      </button>
    </form>
  );
}
