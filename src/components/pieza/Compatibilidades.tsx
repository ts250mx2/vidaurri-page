import Link from "next/link";
import { rangoAnios } from "@/lib/formato";
import { slugificar } from "@/lib/slug";

// "Le queda a:": compatibilidades de la pieza por modelo y años. Cada modelo
// es un chip que enlaza al catálogo por slug (/refacciones/marca/modelo).
// La tabla llega abierta solo cuando la lista es corta.

const MAX_FILAS_ABIERTAS = 6;

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
    <details open={abierta} className="carta overflow-hidden">
      <summary className="flex cursor-pointer select-none items-baseline gap-2 p-5">
        <h2 className="titulo-display text-lg">Le queda a:</h2>
        <span className="num-tab text-sm text-tinta-suave">
          {aplicaciones.length}{" "}
          {aplicaciones.length === 1 ? "modelo" : "modelos"}
        </span>
      </summary>
      <table className="w-full border-t border-borde text-sm">
        <thead>
          <tr className="bg-fondo text-left">
            <th scope="col" className="rotulo px-5 py-2.5 text-tinta-suave">
              Modelo
            </th>
            <th scope="col" className="rotulo px-5 py-2.5 text-tinta-suave">
              Años
            </th>
          </tr>
        </thead>
        <tbody>
          {aplicaciones.map((a, i) => (
            <tr key={`${a.modelo}-${i}`} className="border-t border-borde">
              <td className="px-5 py-3">
                {marcaSlug ? (
                  <Link
                    href={`/refacciones/${marcaSlug}/${slugificar(a.modelo)}`}
                    className="inline-flex rounded-full border border-borde bg-fondo px-3 py-1 text-[13px] font-semibold transition-colors duration-150 hover:border-grafito hover:bg-grafito hover:text-white"
                  >
                    {a.modelo}
                  </Link>
                ) : (
                  <span className="text-[13px] font-semibold">{a.modelo}</span>
                )}
              </td>
              <td className="num-tab px-5 py-3 font-mono text-tinta-suave">
                {rangoAnios(a.aini, a.afin) || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
