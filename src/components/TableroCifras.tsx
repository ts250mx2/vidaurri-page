import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

// Tablero de cifras de la casa: la franja de la home y la de /nosotros son el
// mismo objeto. Cifra en Barlow grande y grafito — el ámbar no se gasta aquí
// porque no hay nada que tocar.
//
// Las cifras las arma quien lo usa a partir de los resúmenes reales: si una
// base no respondió, ese dato simplemente no viene en la lista. Nunca se
// inventa un número, así que `datos` puede traer entre 1 y 5 entradas.

export interface CifraCasa {
  icono: LucideIcon;
  cifra: string;
  texto: string;
}

export function TableroCifras({
  datos,
  etiqueta,
  className,
}: {
  datos: CifraCasa[];
  /** aria-label de la sección (ej. "Datos de la casa"). */
  etiqueta: string;
  className?: string;
}) {
  if (datos.length === 0) return null;

  return (
    <section
      aria-label={etiqueta}
      className={clsx("trama-rejilla border-y border-borde bg-superficie", className)}
    >
      <div className="mx-auto max-w-6xl px-4">
        {/* El filete izquierdo solo va cuando la celda NO abre renglón, y el
            renglón mide 2 columnas en móvil y hasta 5 en desktop. */}
        <ul
          className={clsx(
            "grid grid-cols-2",
            datos.length >= 5 ? "md:grid-cols-5" : "md:grid-cols-4"
          )}
        >
          {datos.map((d, i) => {
            const columnasDesktop = datos.length >= 5 ? 5 : 4;
            return (
              <li
                key={d.texto}
                className={clsx(
                  "flex flex-col gap-1 py-6 md:py-7",
                  i % 2 === 0 ? "pl-0" : "border-l border-borde pl-5",
                  i % columnasDesktop === 0
                    ? "md:border-l-0 md:pl-0"
                    : "md:border-l md:border-borde md:pl-5",
                  i >= 2 && "border-t border-borde md:border-t-0"
                )}
              >
                <d.icono aria-hidden className="size-5 text-tinta-suave" />
                <span className="titulo-cartel num-tab mt-1 text-[clamp(1.75rem,4.5vw,2.5rem)] text-tinta">
                  {d.cifra}
                </span>
                <span className="font-display text-[13px] font-semibold uppercase leading-tight tracking-[0.08em] text-tinta-suave">
                  {d.texto}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
