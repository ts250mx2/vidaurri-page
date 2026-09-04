"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { CLASE_BOTON_PLANO, CLASE_CAMPO, CLASE_ERROR, CLASE_ETIQUETA } from "@/components/mostrador/estilos";
import { CANTIDAD_MIN, Stepper } from "@/components/mostrador/Stepper";
import { pesos } from "@/lib/formato";
import {
  arregloDe,
  esOk,
  llamarProxy,
  mensajeFallo,
  sesionVencida,
  STATUS_ABORTADA,
} from "@/lib/mostrador/navegador";
import type { ArticuloParaPedido } from "@/lib/mostrador/tipos";

// Buscador manual de artículos de bdav (`GET /api/mostrador/articulos`) para
// meter piezas a un pedido sin pasar por Vico. Lo comparten el borrador del
// nuevo pedido ("Agregar sin Vico") y la edición del detalle ("Agregar
// pieza"): por código o descripción, con el precio que IA calcula para el
// cliente del pedido (por eso `idCliente` va en la consulta y en las deps: al
// cambiar de cliente, los precios de la lista cambian). La cantidad se captura
// por renglón con el stepper; el precio nunca sale del navegador. `onAgregar`
// devuelve el texto del error o null: si salió bien el botón dice "Agregado ✓"
// 2 s, si no, el error se pinta aquí mismo. El botón va en plano, nunca en
// ámbar: el ámbar es de la acción que cierra el pedido.

export type AgregarArticulo = (codigo: string, cantidad: number) => Promise<string | null>;

interface PropsBuscadorArticulos {
  /** Rótulo del bloque: "Agregar sin Vico" en el borrador, "Agregar pieza" en el detalle. */
  titulo: string;
  ayuda: string;
  idCliente: number | null;
  /** El padre está a media acción: se espera antes de agregar. */
  ocupado: boolean;
  onAgregar: AgregarArticulo;
}

const DEBOUNCE_MS = 300;
const MIN_BUSQUEDA = 2;
const BUSQUEDA_MAX = 80;
/** Lo que dura el "Agregado ✓" antes de volver a ofrecer el botón. */
const MOSTRAR_AGREGADO_MS = 2000;
const ERROR_BUSQUEDA = "No fue posible buscar en el catálogo";
const TEXTO_AGREGAR = "Agregar";
const TEXTO_AGREGANDO = "Agregando…";
const TEXTO_AGREGADO = "Agregado ✓";

export function BuscadorArticulos({ titulo, ayuda, idCliente, ocupado, onAgregar }: PropsBuscadorArticulos) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<ArticuloParaPedido[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [agregando, setAgregando] = useState<string | null>(null);
  const [agregado, setAgregado] = useState<string | null>(null);
  // El "Agregado ✓" se apaga solo; si el bloque se desmonta antes, se limpia.
  const temporizadores = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const textoBusqueda = busqueda.trim().slice(0, BUSQUEDA_MAX);
  const busquedaActiva = textoBusqueda.length >= MIN_BUSQUEDA;

  useEffect(() => {
    const pendientes = temporizadores.current;
    return () => pendientes.forEach(clearTimeout);
  }, []);

  // Debounce de 300 ms y aborto de la búsqueda anterior: al teclear rápido
  // solo llega a bdav la última, y una respuesta tardía nunca pisa a una más
  // nueva. El estado se toca dentro del temporizador, no en el efecto.
  useEffect(() => {
    if (!busquedaActiva) return;
    const control = new AbortController();
    const temporizador = setTimeout(async () => {
      setBuscando(true);
      const parametros = new URLSearchParams({ busqueda: textoBusqueda });
      if (idCliente !== null) parametros.set("idCliente", String(idCliente));
      const respuesta = await llamarProxy(`/articulos?${parametros}`, { signal: control.signal });
      if (respuesta.status === STATUS_ABORTADA || control.signal.aborted) return;
      setBuscando(false);
      if (sesionVencida(respuesta.status)) return;
      if (!esOk(respuesta.datos)) {
        setError(mensajeFallo(respuesta, ERROR_BUSQUEDA));
        return;
      }
      setError(null);
      setResultados(arregloDe<ArticuloParaPedido>(respuesta.datos, "articulos"));
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(temporizador);
      control.abort();
    };
  }, [busquedaActiva, textoBusqueda, idCliente]);

  function cambiarCantidad(codigo: string, cantidad: number) {
    setCantidades((previas) => ({ ...previas, [codigo]: cantidad }));
  }

  async function agregar(codigo: string) {
    if (agregando) return;
    setAgregando(codigo);
    setError(null);
    const fallo = await onAgregar(codigo, cantidades[codigo] ?? CANTIDAD_MIN);
    setAgregando(null);
    if (fallo) {
      setError(fallo);
      return;
    }
    setAgregado(codigo);
    const temporizador = setTimeout(() => {
      temporizadores.current.delete(temporizador);
      setAgregado((actual) => (actual === codigo ? null : actual));
    }, MOSTRAR_AGREGADO_MS);
    temporizadores.current.add(temporizador);
  }

  function textoDelBoton(codigo: string): string {
    if (agregando === codigo) return TEXTO_AGREGANDO;
    if (agregado === codigo) return TEXTO_AGREGADO;
    return TEXTO_AGREGAR;
  }

  const bloqueado = ocupado || agregando !== null;

  return (
    <div className="lamina flex flex-col gap-3 p-4">
      <div>
        <p className={CLASE_ETIQUETA}>{titulo}</p>
        <p className="mt-1 text-xs text-tinta-suave">{ayuda}</p>
      </div>
      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Ej: FACIA VERSA o el código"
        aria-label="Buscar artículo por código o descripción"
        maxLength={BUSQUEDA_MAX}
        autoComplete="off"
        className={`${CLASE_CAMPO} font-mono uppercase placeholder:font-sans placeholder:normal-case`}
      />

      {error && (
        <p role="alert" className={CLASE_ERROR}>
          {error}
        </p>
      )}

      {busquedaActiva && (
        <ul className="flex max-h-96 flex-col divide-y divide-linea overflow-y-auto rounded-md border border-linea">
          {buscando && resultados.length === 0 && (
            <li className="px-3 py-2 text-sm text-tinta-suave">Buscando…</li>
          )}
          {!buscando && !error && resultados.length === 0 && (
            <li className="px-3 py-2 text-sm text-tinta-suave">Nada con ese dato en bdav; pregúntale a Vico.</li>
          )}
          {resultados.map((a) => {
            const hayExistencia = a.existencia > 0;
            const recienAgregado = agregado === a.codigo;
            return (
              <li key={a.codigo} className="flex flex-col gap-2 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="num-tab font-mono text-xs text-tinta-suave">{a.codigo}</p>
                  <p className="text-sm font-semibold leading-snug text-tinta">{a.descripcion}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
                    <span className={hayExistencia ? "font-semibold text-existencia" : "text-tinta-suave"}>
                      {hayExistencia ? `En existencia: ${a.existencia}` : "Sin existencia"}
                    </span>
                    <span className="num-tab font-mono text-tinta">{pesos(a.precioConIva)} IVA incluido</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Stepper
                    etiqueta={`Cantidad de ${a.codigo}`}
                    cantidad={cantidades[a.codigo] ?? CANTIDAD_MIN}
                    bloqueado={bloqueado}
                    onCambiar={(cantidad) => cambiarCantidad(a.codigo, cantidad)}
                  />
                  <button
                    type="button"
                    onClick={() => void agregar(a.codigo)}
                    disabled={bloqueado || recienAgregado}
                    className={clsx(
                      CLASE_BOTON_PLANO,
                      "h-11 flex-1",
                      recienAgregado && "bg-existencia hover:bg-existencia disabled:opacity-100"
                    )}
                  >
                    {textoDelBoton(a.codigo)}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
