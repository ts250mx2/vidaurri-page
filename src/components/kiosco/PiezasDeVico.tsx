"use client";

import { useEffect, useRef, useState } from "react";
import type { CapturaPartida } from "@/lib/mostrador/tipos";
import type { PiezaDeVico } from "@/lib/kiosco/tipos";
import { VisorPieza } from "@/components/VisorPieza";
import { urlFotoNueva } from "@/lib/fotos";
import { RenglonPieza, type FaseAgregar } from "./RenglonPieza";

// Las piezas que Vico consultó en el turno, bajo su respuesta, con el botón
// "Agregar al pedido": el cliente le describe la pieza con sus palabras y la
// mete al pedido de un toque, sin teclear un código que no conoce. El precio
// NO viaja: solo origen, código o id de pieza usada y cantidad 1; IA vuelve a
// cotizarla a precio de mostrador, así que cuesta lo mismo por los dos caminos.

export type AgregarPieza = (captura: CapturaPartida) => Promise<string | null>;

/** Lo que dura el "Agregado ✓" antes de volver a ofrecer el botón. */
const MOSTRAR_AGREGADO_MS = 2000;

/** Una nueva y una usada pueden compartir código: la llave lleva el origen. */
function claveDe(pieza: PiezaDeVico): string {
  return `${pieza.origen}:${pieza.idPiezaUsada ?? pieza.codigo}`;
}

/** Una usada es una unidad física: siempre va de una en una, por su id. */
function capturaDe(pieza: PiezaDeVico): CapturaPartida {
  return pieza.origen === "usada"
    ? { origen: "usada", codigo: null, idPiezaUsada: pieza.idPiezaUsada, cantidad: 1 }
    : { origen: "nueva", codigo: pieza.codigo, idPiezaUsada: null, cantidad: 1 };
}

export function PiezasDeVico({
  piezas,
  ocupado = false,
  onAgregar,
}: {
  piezas: PiezaDeVico[];
  ocupado?: boolean;
  onAgregar: AgregarPieza;
}) {
  const [fases, setFases] = useState<Record<string, FaseAgregar>>({});
  const [errores, setErrores] = useState<Record<string, string>>({});
  /** La pieza abierta en grande (`VisorPieza`); null = cerrado. */
  const [ampliada, setAmpliada] = useState<PiezaDeVico | null>(null);
  // Los "Agregado ✓" se apagan solos; si el chat se reinicia antes, se limpian.
  const temporizadores = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const pendientes = temporizadores.current;
    return () => pendientes.forEach(clearTimeout);
  }, []);

  const hayAgregando = Object.values(fases).some((f) => f === "agregando");

  async function agregar(pieza: PiezaDeVico) {
    const clave = claveDe(pieza);
    if (hayAgregando) return;
    setFases((previas) => ({ ...previas, [clave]: "agregando" }));
    setErrores((previos) => {
      const resto = { ...previos };
      delete resto[clave];
      return resto;
    });
    const fallo = await onAgregar(capturaDe(pieza));
    if (fallo) {
      setFases((previas) => ({ ...previas, [clave]: "libre" }));
      setErrores((previos) => ({ ...previos, [clave]: fallo }));
      return;
    }
    setFases((previas) => ({ ...previas, [clave]: "agregado" }));
    const temporizador = setTimeout(() => {
      temporizadores.current.delete(temporizador);
      setFases((previas) => ({ ...previas, [clave]: "libre" }));
    }, MOSTRAR_AGREGADO_MS);
    temporizadores.current.add(temporizador);
  }

  return (
    <>
    {ampliada && (
      <VisorPieza
        pieza={{
          foto: ampliada.foto ?? (ampliada.origen === "nueva" ? urlFotoNueva(ampliada.codigo) : null),
          codigo: ampliada.codigo,
          descripcion: ampliada.descripcion,
          precioConIva: ampliada.precioConIva,
          existencia:
            ampliada.origen === "usada" ? "Pieza única" : ampliada.hayEnTienda ? "En existencia" : "Sobre pedido",
        }}
        onCerrar={() => setAmpliada(null)}
        accion={{
          texto: "Agregar",
          disabled: ocupado || hayAgregando || fases[claveDe(ampliada)] === "agregado",
          onClick: () => {
            const pieza = ampliada;
            setAmpliada(null);
            void agregar(pieza);
          },
        }}
      />
    )}
    <ul
      aria-label="Piezas que encontró Vico"
      className="mt-3 flex flex-col divide-y divide-linea border-t border-linea"
    >
      {piezas.map((pieza) => {
        const clave = claveDe(pieza);
        return (
          <RenglonPieza
            key={clave}
            codigo={pieza.codigo}
            descripcion={pieza.descripcion}
            precioConIva={pieza.precioConIva}
            hayEnTienda={pieza.hayEnTienda}
            foto={pieza.foto}
            prioritaria
            onAmpliar={() => setAmpliada(pieza)}
            fase={fases[clave] ?? "libre"}
            error={errores[clave] ?? null}
            bloqueado={ocupado || hayAgregando}
            onAgregar={() => void agregar(pieza)}
          />
        );
      })}
    </ul>
    </>
  );
}
