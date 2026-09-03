"use client";

import { useEffect, useState } from "react";
import { CLASE_BOTON_PLANO, CLASE_CAMPO, CLASE_ERROR, CLASE_ETIQUETA } from "@/components/mostrador/estilos";
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
import type { ResultadoAccion } from "./NuevoPedido";

// Buscador manual de artículos de bdav para agregar al borrador sin pasar por
// Vico: por código o descripción, con el precio que IA calcula para el
// cliente elegido (por eso `idCliente` va en la consulta y en las deps: al
// cambiar de cliente, los precios de la lista cambian). La cantidad se captura
// por renglón; el precio nunca sale del navegador.

interface PropsAgregarSinVico {
  idCliente: number | null;
  ocupado: boolean;
  onAgregar: (codigo: string, cantidad: number) => ResultadoAccion;
}

const DEBOUNCE_MS = 300;
const MIN_BUSQUEDA = 2;
const BUSQUEDA_MAX = 80;
const CANTIDAD_MIN = 1;
const CANTIDAD_MAX = 99;
const ERROR_BUSQUEDA = "No fue posible buscar en el catálogo";

/** Cantidad tecleada acotada a [1, 99]; lo que no sea número cuenta como 1. */
function leerCantidad(crudo: string): number {
  const numero = Number.parseInt(crudo, 10);
  if (!Number.isFinite(numero)) return CANTIDAD_MIN;
  return Math.min(CANTIDAD_MAX, Math.max(CANTIDAD_MIN, numero));
}

export function AgregarSinVico({ idCliente, ocupado, onAgregar }: PropsAgregarSinVico) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<ArticuloParaPedido[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [agregando, setAgregando] = useState<string | null>(null);

  const textoBusqueda = busqueda.trim().slice(0, BUSQUEDA_MAX);
  const busquedaActiva = textoBusqueda.length >= MIN_BUSQUEDA;

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

  async function agregar(codigo: string) {
    if (agregando) return;
    setAgregando(codigo);
    setError(null);
    const fallo = await onAgregar(codigo, cantidades[codigo] ?? CANTIDAD_MIN);
    setAgregando(null);
    if (fallo) setError(fallo);
  }

  return (
    <div className="lamina flex flex-col gap-3 p-4">
      <div>
        <p className={CLASE_ETIQUETA}>Agregar sin Vico</p>
        <p className="mt-1 text-xs text-tinta-suave">Por código o descripción; el precio ya trae el descuento del cliente.</p>
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
                  <input
                    type="number"
                    inputMode="numeric"
                    min={CANTIDAD_MIN}
                    max={CANTIDAD_MAX}
                    value={cantidades[a.codigo] ?? CANTIDAD_MIN}
                    onChange={(e) =>
                      setCantidades({ ...cantidades, [a.codigo]: leerCantidad(e.target.value) })
                    }
                    aria-label={`Cantidad de ${a.codigo}`}
                    className={`${CLASE_CAMPO} num-tab w-20 font-mono`}
                  />
                  <button
                    type="button"
                    onClick={() => void agregar(a.codigo)}
                    disabled={ocupado || agregando !== null}
                    className={`${CLASE_BOTON_PLANO} flex-1`}
                  >
                    {agregando === a.codigo ? "Agregando…" : "Agregar"}
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
