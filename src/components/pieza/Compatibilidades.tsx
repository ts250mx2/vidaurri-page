import Link from "next/link";
import { rangoAnios } from "@/lib/formato";
import { slugificar } from "@/lib/slug";

// "Le queda a:" — la tabla de aplicaciones de la hoja de partida. Es una tabla
// técnica de verdad: dos columnas, filete fino entre renglones y los años en
// mono con cifras tabulares, que es como se alinea una columna de cotas.
// Cada modelo es un enlace al catálogo por slug, con el renglón completo como
// área tocable. La tabla llega abierta solo cuando la lista es corta.

const MAX_FILAS_ABIERTAS = 6;

const CLASE_ENCABEZADO =
  "px-5 py-2.5 font-display text-[11px] font-bold uppercase leading-none tracking-[0.14em] text-tinta-suave";

export function Compatibilidades({
  marca,
  aplicaciones,
}: {
  marca: string;
  aplicaciones: Array<{ modelo: string; aini: number | null; afin: number | null }>;
}) {
  if (aplicaciones.length === 0) return null;

  const marcaSlug = marca ? slugificar(marca) : "";
  const abierta = aplicaciones.length <= MAX_FILAS_ABIERTAS;

  return (
    <details open={abierta} className="lamina overflow-hidden">
      <summary className="flex min-h-12 cursor-pointer select-none items-baseline gap-2.5 px-5 py-3.5">
        <h2 className="rotulo-tecnico text-lg">Le queda a:</h2>
        <span className="num-tab font-mono text-sm text-tinta-suave">
          {aplicaciones.length} {aplicaciones.length === 1 ? "modelo" : "modelos"}
        </span>
      </summary>

      <table className="w-full border-t border-linea text-sm">
        <thead>
          <tr className="bg-papel text-left">
            <th scope="col" className={CLASE_ENCABEZADO}>
              Modelo
            </th>
            <th scope="col" className={`${CLASE_ENCABEZADO} text-right`}>
              Años
            </th>
          </tr>
        </thead>
        <tbody>
          {aplicaciones.map((a, i) => (
            <tr key={`${a.modelo}-${i}`} className="border-t border-linea">
              <td className="px-5">
                {marcaSlug ? (
                  <Link
                    href={`/refacciones/${marcaSlug}/${slugificar(a.modelo)}`}
                    className="flex min-h-11 items-center font-semibold text-tinta underline-offset-4 transition-colors duration-150 hover:underline"
                  >
                    {a.modelo}
                  </Link>
                ) : (
                  <span className="flex min-h-11 items-center font-semibold text-tinta">
                    {a.modelo}
                  </span>
                )}
              </td>
              <td className="num-tab whitespace-nowrap px-5 text-right font-mono text-tinta-suave">
                {rangoAnios(a.aini, a.afin) || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
