"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Search } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { CLASE_CAMPO_KIOSCO, CLASE_ERROR_KIOSCO } from "@/components/kiosco/estilos";
import { RenglonPieza, type FaseAgregar } from "@/components/kiosco/RenglonPieza";
import { Tecla } from "@/components/kiosco/Tecla";
import {
  arregloDe,
  esOk,
  kioscoDesactivado,
  llamarKiosco,
  mensajeFallo,
  STATUS_ABORTADA,
} from "@/lib/kiosco/navegador";
import type { ArticuloKiosco } from "@/lib/kiosco/tipos";
import type { CapturaPartida } from "@/lib/mostrador/tipos";

// El buscador del kiosco: lo primero que ve el cliente y lo único que tiene el
// foco al llegar. Se opera entero con el teclado, sin tocar el ratón:
//
//   Enter    busca ya (sin esperar el retardo) y salta al primer resultado
//   ↓ ↑      recorren los resultados (el foco real va al botón del renglón,
//            así que Enter los agrega sin inventar manejadores)
//   Enter    en un resultado, lo agrega al pedido
//   Escape   limpia la búsqueda y regresa el cursor al campo; con el campo ya
//            vacío, regresa a Vico, que es la pantalla por default
//
// Los atajos se pintan junto a cada acción: el kiosco no tiene manual.

const DEBOUNCE_MS = 250;
const MIN_BUSQUEDA = 2;
const BUSQUEDA_MAX = 60;
/** Lo que dura el "Agregado ✓" antes de volver a ofrecer el botón. */
const MOSTRAR_AGREGADO_MS = 2000;
const ERROR_BUSQUEDA = "No pude buscar en el catálogo; inténtalo otra vez";

export type AgregarDelBuscador = (captura: CapturaPartida) => Promise<string | null>;

export function BuscadorKiosco({
  ocupado,
  onAgregar,
  onVolverAVico,
}: {
  ocupado: boolean;
  onAgregar: AgregarDelBuscador;
  /** Escape con el campo vacío: de vuelta a Vico, la pantalla por default. */
  onVolverAVico: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<ArticuloKiosco[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fases, setFases] = useState<Record<string, FaseAgregar>>({});
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [activo, setActivo] = useState(-1);
  /** Sube con cada Enter: reejecuta la búsqueda aunque el texto no haya cambiado. */
  const [disparo, setDisparo] = useState(0);

  const campoRef = useRef<HTMLInputElement>(null);
  const botonesRef = useRef<Array<HTMLButtonElement | null>>([]);
  /** Enter con resultados todavía sin llegar: se salta al primero en cuanto lleguen. */
  const irAlPrimero = useRef(false);
  /** Enter: esta búsqueda sale sin esperar el retardo. Se consume al usarla. */
  const sinEspera = useRef(false);
  const temporizadores = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const texto = busqueda.trim().slice(0, BUSQUEDA_MAX);
  const busquedaActiva = texto.length >= MIN_BUSQUEDA;
  // Con menos de dos letras no se enseña nada: los resultados de la búsqueda
  // anterior se ocultan al derivarlos, sin tener que vaciarlos desde el efecto.
  const visibles = busquedaActiva ? resultados : [];

  // El cliente llega y teclea: el foco es del campo desde el primer instante.
  useEffect(() => {
    campoRef.current?.focus();
  }, []);

  useEffect(() => {
    const pendientes = temporizadores.current;
    return () => pendientes.forEach(clearTimeout);
  }, []);

  // Retardo corto y aborto de la búsqueda anterior: al teclear rápido solo
  // llega a bdav la última, y una respuesta tardía nunca pisa a una más nueva.
  useEffect(() => {
    if (!busquedaActiva) return;
    const control = new AbortController();
    // El retardo se consume aquí: solo la búsqueda que pidió Enter sale sin
    // esperar, y la siguiente vuelve a teclearse con calma.
    const espera = sinEspera.current ? 0 : DEBOUNCE_MS;
    sinEspera.current = false;
    const temporizador = setTimeout(
      async () => {
        setBuscando(true);
        const parametros = new URLSearchParams({ busqueda: texto });
        const respuesta = await llamarKiosco(`/articulos?${parametros}`, { signal: control.signal });
        if (respuesta.status === STATUS_ABORTADA || control.signal.aborted) return;
        setBuscando(false);
        if (kioscoDesactivado(respuesta.status)) return;
        if (!esOk(respuesta.datos)) {
          setError(mensajeFallo(respuesta, ERROR_BUSQUEDA));
          return;
        }
        setError(null);
        setResultados(arregloDe<ArticuloKiosco>(respuesta.datos, "articulos"));
      },
      espera
    );
    return () => {
      clearTimeout(temporizador);
      control.abort();
    };
  }, [busquedaActiva, texto, disparo]);

  // Enter pedido antes de que llegaran los resultados: en cuanto hay lista, el
  // foco salta al primer renglón y otro Enter lo agrega.
  useEffect(() => {
    if (!irAlPrimero.current || !busquedaActiva || resultados.length === 0) return;
    irAlPrimero.current = false;
    botonesRef.current[0]?.focus();
  }, [resultados, busquedaActiva]);

  function limpiar() {
    setBusqueda("");
    setError(null);
    setActivo(-1);
    campoRef.current?.focus();
  }

  function enfocar(indice: number) {
    const boton = botonesRef.current[indice];
    if (!boton) return;
    boton.focus();
    boton.scrollIntoView({ block: "nearest" });
  }

  function alTeclearEnCampo(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === "Escape") {
      evento.preventDefault();
      if (!busqueda) {
        onVolverAVico();
        return;
      }
      limpiar();
      return;
    }
    if (evento.key === "Enter") {
      evento.preventDefault();
      if (!busquedaActiva) return;
      if (visibles.length > 0 && !buscando) {
        enfocar(0);
        return;
      }
      irAlPrimero.current = true;
      sinEspera.current = true;
      setDisparo((n) => n + 1);
      return;
    }
    if (evento.key === "ArrowDown" && visibles.length > 0) {
      evento.preventDefault();
      enfocar(0);
    }
  }

  /**
   * Teclas sobre la lista. El índice sale del botón que tiene el foco, no de un
   * envoltorio por renglón: así el `<ul>` solo contiene `<li>` y el teclado y
   * el foco real siguen siendo los del navegador.
   */
  function alTeclearEnResultados(evento: KeyboardEvent<HTMLUListElement>) {
    const indice = botonesRef.current.indexOf(document.activeElement as HTMLButtonElement);
    if (indice < 0) return;
    if (evento.key === "Escape") {
      evento.preventDefault();
      limpiar();
      return;
    }
    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      enfocar(Math.min(indice + 1, visibles.length - 1));
      return;
    }
    if (evento.key === "ArrowUp") {
      evento.preventDefault();
      // Arriba del primer resultado está el campo: se vuelve a teclear.
      if (indice === 0) {
        campoRef.current?.focus();
        setActivo(-1);
        return;
      }
      enfocar(indice - 1);
    }
  }

  async function agregar(articulo: ArticuloKiosco) {
    const { codigo } = articulo;
    if (Object.values(fases).includes("agregando")) return;
    setFases((previas) => ({ ...previas, [codigo]: "agregando" }));
    setErrores((previos) => {
      const resto = { ...previos };
      delete resto[codigo];
      return resto;
    });
    const fallo = await onAgregar({ origen: "nueva", codigo, idPiezaUsada: null, cantidad: 1 });
    if (fallo) {
      setFases((previas) => ({ ...previas, [codigo]: "libre" }));
      setErrores((previos) => ({ ...previos, [codigo]: fallo }));
      return;
    }
    setFases((previas) => ({ ...previas, [codigo]: "agregado" }));
    // El botón que se acaba de pulsar se queda inhabilitado mientras dice
    // "Agregado ✓", y un foco en un botón muerto deja el teclado sin destino:
    // el cursor vuelve al campo, con lo tecleado seleccionado, que es donde el
    // cliente va a escribir la siguiente pieza.
    campoRef.current?.focus();
    campoRef.current?.select();
    const temporizador = setTimeout(() => {
      temporizadores.current.delete(temporizador);
      setFases((previas) => ({ ...previas, [codigo]: "libre" }));
    }, MOSTRAR_AGREGADO_MS);
    temporizadores.current.add(temporizador);
  }

  const hayAgregando = Object.values(fases).includes("agregando");
  const sinResultados = busquedaActiva && !buscando && !error && visibles.length === 0;

  return (
    <div className="lamina flex h-full flex-col overflow-hidden">
      <div className="border-b border-linea bg-hoja px-5 py-4">
        <label htmlFor="busqueda-kiosco" className="rotulo-tecnico text-sm text-tinta-suave">
          Busca tu pieza
        </label>
        <div className="relative mt-2">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 size-6 -translate-y-1/2 text-tinta-suave"
          />
          <input
            id="busqueda-kiosco"
            ref={campoRef}
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={alTeclearEnCampo}
            placeholder="Ej: FACIA VERSA, calavera Aveo o el código de la pieza"
            maxLength={BUSQUEDA_MAX}
            autoComplete="off"
            autoCapitalize="characters"
            className={twMerge(CLASE_CAMPO_KIOSCO, "pl-14")}
          />
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-tinta-suave">
          <span>
            <Tecla>Enter</Tecla> busca
          </span>
          <span>
            <Tecla>↓</Tecla> <Tecla>↑</Tecla> recorren los resultados
          </span>
          <span>
            <Tecla>Esc</Tecla> limpia; con el campo vacío, vuelve a Vico
          </span>
        </p>
      </div>

      <div className="flex-1 overflow-y-auto bg-hoja">
        {error && (
          <p role="alert" className={`${CLASE_ERROR_KIOSCO} m-5`}>
            {error}
          </p>
        )}

        {!busquedaActiva && !error && (
          <div className="px-6 py-10 text-center">
            <p className="titulo-lamina text-2xl text-tinta">Escribe qué pieza necesitas</p>
            <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-tinta-suave">
              Con el nombre basta: <span className="font-semibold text-tinta">facia</span>,{" "}
              <span className="font-semibold text-tinta">calavera</span>,{" "}
              <span className="font-semibold text-tinta">cofre</span>… y la marca y el modelo de tu
              carro. Si traes el código de la pieza, también sirve.
            </p>
          </div>
        )}

        {buscando && visibles.length === 0 && (
          <p className="px-6 py-8 text-center text-base text-tinta-suave">Buscando en el catálogo…</p>
        )}

        {sinResultados && (
          <div className="px-6 py-10 text-center">
            <p className="titulo-lamina text-2xl text-tinta">No encontré nada con ese dato</p>
            <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-tinta-suave">
              Prueba con otras palabras, o pregúntale a Vico aquí abajo: él entiende
              &ldquo;el foco de adelante de un Versa 2016&rdquo;. También te atendemos en el mostrador.
            </p>
          </div>
        )}

        {visibles.length > 0 && (
          <ul
            aria-label="Resultados de la búsqueda"
            onKeyDown={alTeclearEnResultados}
            className="divide-y divide-linea"
          >
            {visibles.map((articulo, i) => (
              <RenglonPieza
                key={articulo.codigo}
                ref={(boton) => {
                  botonesRef.current[i] = boton;
                }}
                codigo={articulo.codigo}
                descripcion={articulo.descripcion}
                precioConIva={articulo.precioConIva}
                hayEnTienda={articulo.hayEnTienda}
                fase={fases[articulo.codigo] ?? "libre"}
                error={errores[articulo.codigo] ?? null}
                bloqueado={ocupado || hayAgregando}
                activo={activo === i}
                conTeclaEnter
                onFoco={() => setActivo(i)}
                onAgregar={() => void agregar(articulo)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
