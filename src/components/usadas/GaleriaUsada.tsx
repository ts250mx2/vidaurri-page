"use client";

import { useState } from "react";
import clsx from "clsx";
import { FotoPieza } from "@/components/FotoPieza";

// Galeria de la ficha de pieza usada: foto principal grande + tira de
// miniaturas clicables. Las fotos son REALES (la pieza exacta que recibes),
// por eso la banda superior lo dice. Sin fotos, cae al marcador de FotoPieza.

function urlFoto(nombre: string): string {
  return `/api/usadas/foto?n=${encodeURIComponent(nombre)}`;
}

export function GaleriaUsada({
  fotos,
  descripcion,
}: {
  /** nombre_imagen de cada foto activa, en orden. */
  fotos: string[];
  descripcion: string;
}) {
  const [actual, setActual] = useState(0);
  const [caidas, setCaidas] = useState<number[]>([]);

  const marcarCaida = (indice: number) => {
    setCaidas((prev) => (prev.includes(indice) ? prev : [...prev, indice]));
  };

  const fotoActual = fotos[actual] ?? fotos[0] ?? null;

  return (
    <div className="carta self-start overflow-hidden">
      {fotos.length > 0 && (
        <p className="flex items-center gap-2 border-b border-borde bg-grafito px-4 py-2.5 font-display text-xs font-bold uppercase tracking-[0.1em] text-white">
          <span aria-hidden className="size-1.5 rounded-full bg-exito" />
          Fotos de la pieza exacta que recibes
        </p>
      )}

      <div className="p-3">
        <FotoPieza
          key={fotoActual ?? "sin-foto"}
          src={fotoActual ? urlFoto(fotoActual) : null}
          alt={
            fotoActual
              ? `Foto real ${actual + 1} de ${fotos.length}: ${descripcion}`
              : `Foto de ${descripcion} pendiente de tomar`
          }
          className="trama-anaquel aspect-[4/3] w-full rounded-lg border border-borde"
          imgClassName="object-cover"
        />

        {fotos.length > 1 && (
          <ul
            aria-label="Miniaturas de la pieza"
            className="mt-3 flex gap-2 overflow-x-auto pb-1"
          >
            {fotos.map((foto, i) =>
              caidas.includes(i) ? null : (
                <li key={foto} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setActual(i)}
                    aria-label={`Ver foto ${i + 1} de ${fotos.length}`}
                    aria-current={i === actual ? "true" : undefined}
                    className={clsx(
                      "block size-16 overflow-hidden rounded-lg border-2 bg-white transition-colors duration-150",
                      i === actual
                        ? "border-grafito"
                        : "border-borde hover:border-tinta-suave"
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={urlFoto(foto)}
                      alt=""
                      loading="lazy"
                      onError={() => marcarCaida(i)}
                      className="h-full w-full object-cover"
                    />
                  </button>
                </li>
              )
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
