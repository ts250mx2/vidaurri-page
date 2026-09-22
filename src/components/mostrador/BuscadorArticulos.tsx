"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { FotoAmpliable, VisorPieza } from "@/components/VisorPieza";
import { CLASE_BOTON_PLANO, CLASE_CAMPO, CLASE_ERROR, CLASE_ETIQUETA } from "@/components/mostrador/estilos";
import { CANTIDAD_MIN, Stepper } from "@/components/mostrador/Stepper";
import { pesos } from "@/lib/formato";
import { urlFotoNueva } from "@/lib/fotos";
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
// meter piezas a un pedido sin pasar por Vico (ni gastar tokens). Lo comparten
// la columna central del nuevo pedido ("Buscar piezas") y la edición del
// detalle ("Agregar pieza"): por pieza, código, marca, modelo o año —IA cruza
// cada palabra con descripción, código y línea, y un año con el rango del
// artículo—, con el precio que IA calcula para el
// cliente del pedido (por eso `idCliente` va en la consulta y en las deps: al
// cambiar de cliente, los precios de la lista cambian). Cada renglón lleva la
// foto de catálogo a tamaño completo (nunca `thumb=1`: pixela) por el mismo
// proxy sellado del sitio público. La cantidad se captura
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
  /** Renglones que se piden a IA (acota a 100); sin él, los 20 de siempre. */
  limite?: number;
  /** Alto de la lista de resultados; sin él, `max-h-96`. */
  alto?: string;
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
/** Renglones que nacen a la vista: su foto va con descarga inmediata (Chromium no dispara la carga diferida sin scroll). */
const A_LA_VISTA = 6;

export function BuscadorArticulos({ titulo, ayuda, idCliente, ocupado, onAgregar, limite, alto }: PropsBuscadorArticulos) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<ArticuloParaPedido[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [agregando, setAgregando] = useState<string | null>(null);
  const [agregado, setAgregado] = useState<string | null>(null);
  /** La pieza abierta en grande (`VisorPieza`); null = cerrado. */
  const [ampliada, setAmpliada] = useState<ArticuloParaPedido | null>(null);
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
      if (limite !== undefined) parametros.set("limite", String(limite));
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
  }, [busquedaActiva, textoBusqueda, idCliente, limite]);

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
      {ampliada && (
        <VisorPieza
          pieza={{
            foto: ampliada.foto ? urlFotoNueva(ampliada.foto) : null,
            codigo: ampliada.codigo,
            descripcion: ampliada.descripcion,
            marca: ampliada.marca,
            precioConIva: ampliada.precioConIva,
            existencia: ampliada.existencia > 0 ? `En existencia: ${ampliada.existencia}` : "Sin existencia",
          }}
          onCerrar={() => setAmpliada(null)}
          accion={{
            texto: TEXTO_AGREGAR,
            disabled: bloqueado || agregado === ampliada.codigo,
            onClick: () => {
              const { codigo } = ampliada;
              setAmpliada(null);
              void agregar(codigo);
            },
          }}
        />
      )}
      <div>
        <p className={CLASE_ETIQUETA}>{titulo}</p>
        <p className="mt-1 text-xs text-tinta-suave">{ayuda}</p>
      </div>
      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Ej: FACIA NISSAN VERSA 2017, o el código"
        aria-label="Buscar pieza por nombre, código, marca, modelo o año"
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
        <ul
          className={clsx(
            "flex flex-col divide-y divide-linea overflow-y-auto rounded-md border border-linea",
            alto ?? "max-h-96"
          )}
        >
          {buscando && resultados.length === 0 && (
            <li className="px-3 py-2 text-sm text-tinta-suave">Buscando…</li>
          )}
          {!buscando && !error && resultados.length === 0 && (
            <li className="px-3 py-2 text-sm text-tinta-suave">Nada con ese dato en bdav; pregúntale a Vico.</li>
          )}
          {resultados.map((a, i) => {
            const hayExistencia = a.existencia > 0;
            const recienAgregado = agregado === a.codigo;
            return (
              <li key={a.codigo} className="flex flex-col gap-2 px-3 py-2.5">
                <div className="flex min-w-0 gap-3">
                  <FotoAmpliable
                    src={a.foto ? urlFotoNueva(a.foto) : null}
                    alt={a.descripcion}
                    className="trama-anaquel size-20 rounded-sm border border-linea"
                    imgClassName="p-1"
                    prioritaria={i < A_LA_VISTA}
                    onAmpliar={() => setAmpliada(a)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="num-tab font-mono text-xs text-tinta-suave">
                      {a.codigo}
                      {a.marca && <span className="ml-2 font-sans font-semibold uppercase text-tinta">{a.marca}</span>}
                    </p>
                    <p className="text-sm font-semibold leading-snug text-tinta">{a.descripcion}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
                      <span className={hayExistencia ? "font-semibold text-existencia" : "text-tinta-suave"}>
                        {hayExistencia ? `En existencia: ${a.existencia}` : "Sin existencia"}
                      </span>
                      <span className="num-tab font-mono text-tinta">{pesos(a.precioConIva)} IVA incluido</span>
                    </p>
                  </div>
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
