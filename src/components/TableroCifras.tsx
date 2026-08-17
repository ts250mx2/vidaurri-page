import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

// Tablero de cifras de la casa: la franja de la home y la de /nosotros son el
// mismo objeto. Va sobre lámina blanca con papel milimétrico y las celdas
// separadas por el filete del plano — cifra grande en rotulado, cota debajo.
// El ámbar no se gasta aquí porque no hay nada que tocar.
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
      className={clsx("border-y border-linea bg-hoja", className)}
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
                  i % 2 === 0 ? "pl-0" : "border-l border-linea pl-5",
                  i % columnasDesktop === 0
                    ? "md:border-l-0 md:pl-0"
                    : "md:border-l md:border-linea md:pl-5",
                  i >= 2 && "border-t border-linea md:border-t-0"
                )}
              >
                <d.icono aria-hidden className="size-5 text-tinta-suave" />
                <span className="num-tab mt-1 font-display text-[clamp(1.75rem,4.5vw,2.5rem)] font-bold leading-none tracking-[-0.01em] text-tinta">
                  {d.cifra}
                </span>
                <span className="rotulo-tecnico text-[12px] leading-tight text-tinta-suave">
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
