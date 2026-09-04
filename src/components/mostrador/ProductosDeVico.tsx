"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { CLASE_BOTON_PLANO, CLASE_ERROR } from "@/components/mostrador/estilos";
import { CANTIDAD_MIN, Stepper, acotarCantidad } from "@/components/mostrador/Stepper";
import { pesos } from "@/lib/formato";
import type { CapturaPartida, ProductoMencionado } from "@/lib/mostrador/tipos";

// Renglones "Agregar al pedido" bajo cada respuesta de Vico en el mostrador:
// las piezas que sus herramientas consultaron en ese turno, con el precio que
// él vio. El vendedor las mete al borrador con un clic en vez de dictárselo a
// Vico o teclear el código en el buscador manual. El precio NO viaja: solo
// origen, código/idPieza y cantidad; IA vuelve a cotizar con el descuento del
// cliente del borrador, así que lo que se agrega canta igual por los dos
// caminos. El botón va en plano, nunca en ámbar: el ámbar es de "Enviar
// pedido" y aquí todavía no se envía nada.

export type AgregarDeVico = (partida: CapturaPartida) => Promise<string | null>;

interface PropsProductosDeVico {
  productos: ProductoMencionado[];
  /** El padre está a medio turno o a media acción: se espera antes de agregar. */
  ocupado?: boolean;
  onAgregar: AgregarDeVico;
}

type EstadoRenglon =
  | { fase: "agregando" }
  | { fase: "agregado" }
  | { fase: "error"; texto: string };

/** Lo que dura el "Agregado ✓" antes de volver a ofrecer el botón. */
const MOSTRAR_AGREGADO_MS = 2000;
const TEXTO_AGREGAR = "Agregar al pedido";
const TEXTO_AGREGANDO = "Agregando…";
const TEXTO_AGREGADO = "Agregado ✓";
const TEXTO_SIN_EXISTENCIA = "Sin existencia";
const TEXTO_PIEZA_UNICA = "Pieza única";

/** Una nueva y una usada pueden compartir código: la llave lleva el origen. */
function claveDe(p: ProductoMencionado): string {
  return `${p.origen}:${p.idPiezaUsada ?? p.codigo}`;
}

/**
 * Sin existencia no se agrega una nueva… salvo que la herramienta la haya
 * marcado disponible sobre pedido o no haya dicho nada (sin dato se deja
 * pasar: el mostrador confirma la existencia antes de avisarle al cliente).
 * Solo `sobrePedido: false` —consultado y no hay— la cierra.
 */
function sePuedeAgregar(p: ProductoMencionado): boolean {
  if (p.existencia > 0) return true;
  if (p.origen === "usada") return false;
  return p.sobrePedido !== false;
}

/** Una usada es una unidad física: siempre va de una en una. */
function capturaDe(p: ProductoMencionado, cantidad: number): CapturaPartida {
  return p.origen === "usada"
    ? { origen: "usada", codigo: null, idPiezaUsada: p.idPiezaUsada, cantidad: CANTIDAD_MIN }
    : { origen: "nueva", codigo: p.codigo, idPiezaUsada: null, cantidad };
}

function textoDelBoton(estado: EstadoRenglon | undefined): string {
  if (estado?.fase === "agregando") return TEXTO_AGREGANDO;
  if (estado?.fase === "agregado") return TEXTO_AGREGADO;
  return TEXTO_AGREGAR;
}

function Existencia({ producto }: { producto: ProductoMencionado }) {
  if (producto.origen === "usada") {
    return <span className="sello sello-unica">{TEXTO_PIEZA_UNICA}</span>;
  }
  if (producto.existencia > 0) {
    return (
      <span className="font-semibold text-existencia">En existencia: {producto.existencia}</span>
    );
  }
  return (
    <span className="text-anotacion">
      {TEXTO_SIN_EXISTENCIA}
      {producto.sobrePedido === true ? " · sobre pedido" : ""}
    </span>
  );
}

export function ProductosDeVico({ productos, ocupado = false, onAgregar }: PropsProductosDeVico) {
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [estados, setEstados] = useState<Record<string, EstadoRenglon>>({});
  // Los "Agregado ✓" se apagan solos; si el chat se reinicia antes, se limpian.
  const temporizadores = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const pendientes = temporizadores.current;
    return () => pendientes.forEach(clearTimeout);
  }, []);

  const hayAgregando = Object.values(estados).some((e) => e.fase === "agregando");

  function ponerEstado(clave: string, estado: EstadoRenglon | null) {
    setEstados((previos) => {
      const resto = Object.fromEntries(Object.entries(previos).filter(([k]) => k !== clave));
      return estado ? { ...resto, [clave]: estado } : resto;
    });
  }

  function cambiarCantidad(clave: string, siguiente: number) {
    setCantidades((previas) => ({ ...previas, [clave]: acotarCantidad(siguiente) }));
  }

  async function agregar(p: ProductoMencionado) {
    const clave = claveDe(p);
    if (hayAgregando) return;
    ponerEstado(clave, { fase: "agregando" });
    const fallo = await onAgregar(capturaDe(p, cantidades[clave] ?? CANTIDAD_MIN));
    if (fallo) {
      ponerEstado(clave, { fase: "error", texto: fallo });
      return;
    }
    ponerEstado(clave, { fase: "agregado" });
    const temporizador = setTimeout(() => {
      temporizadores.current.delete(temporizador);
      ponerEstado(clave, null);
    }, MOSTRAR_AGREGADO_MS);
    temporizadores.current.add(temporizador);
  }

  return (
    <ul
      aria-label="Piezas que Vico consultó"
      className="mt-2.5 flex flex-col divide-y divide-linea border-t border-linea"
    >
      {productos.map((p) => {
        const clave = claveDe(p);
        const estado = estados[clave];
        const disponible = sePuedeAgregar(p);
        const esUsada = p.origen === "usada";
        const agregado = estado?.fase === "agregado";
        const bloqueado = ocupado || hayAgregando || !disponible || agregado;
        return (
          <li key={clave} className="flex flex-col gap-2 py-2.5">
            <div className="flex gap-2.5">
              {p.foto && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.foto}
                  alt=""
                  loading="lazy"
                  className="mesa-dibujo size-11 shrink-0 rounded-sm border border-linea object-contain"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-tinta">
                  {p.descripcion}
                </p>
                <p className="num-tab mt-0.5 font-mono text-xs text-tinta-suave">
                  {p.codigo}
                  {esUsada && p.idPiezaUsada !== null ? ` · Usada #${p.idPiezaUsada}` : ""}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  <span className="num-tab font-mono text-tinta">
                    {pesos(p.precioConIva)} IVA incluido
                  </span>
                  <Existencia producto={p} />
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {esUsada ? (
                <span className="num-tab shrink-0 font-mono text-xs text-tinta-suave">1 pieza</span>
              ) : (
                <Stepper
                  etiqueta={`Cantidad de ${p.codigo}`}
                  cantidad={cantidades[clave] ?? CANTIDAD_MIN}
                  bloqueado={bloqueado}
                  onCambiar={(siguiente) => cambiarCantidad(clave, siguiente)}
                />
              )}
              <button
                type="button"
                onClick={() => void agregar(p)}
                disabled={bloqueado}
                title={disponible ? undefined : "Sin existencia: pídele a Vico otra opción"}
                className={clsx(
                  CLASE_BOTON_PLANO,
                  "h-11 flex-1",
                  agregado && "bg-existencia hover:bg-existencia disabled:opacity-100"
                )}
              >
                {textoDelBoton(estado)}
              </button>
            </div>

            {estado?.fase === "error" && (
              <p role="alert" className={CLASE_ERROR}>
                {estado.texto}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
