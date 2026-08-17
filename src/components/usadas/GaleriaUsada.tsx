"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import clsx from "clsx";
import { FotoPieza } from "@/components/FotoPieza";

// Galería de la hoja de partida usada: la foto grande y la tira de miniaturas.
// Las fotos son REALES —la pieza exacta que se entrega—, y eso es la ventaja
// que ningún competidor puede copiar, así que la banda superior lo dice sin
// rodeos. Sin fotos, cae al marcador "foto por tomar" de FotoPieza.

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
    <div className="lamina self-start overflow-hidden">
      {fotos.length > 0 && (
        <p className="rotulo-tecnico flex items-center gap-2 border-b border-linea bg-plano px-4 py-3 text-xs text-white">
          <Camera aria-hidden className="size-4 shrink-0" />
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
          className="aspect-[4/3] w-full rounded-sm border border-linea bg-papel-hondo"
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
                      "block size-16 overflow-hidden rounded-sm border bg-hoja transition-colors duration-150",
                      i === actual
                        ? "border-tinta ring-1 ring-tinta"
                        : "border-linea hover:border-linea-fuerte"
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
