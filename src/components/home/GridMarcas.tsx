import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Marca } from "@/lib/catalogo";
import { slugificar } from "@/lib/slug";
import { LogoMarca } from "@/components/LogoMarca";

// Vitrina de marcas del mostrador: el logo del fabricante manda y debajo va el
// contero real de piezas disponibles, como el letrero de un anaquel. Solo
// entran las marcas que la tienda REALMENTE surte, ya ordenadas de mayor a
// menor por piezas desde la página (antes se listaban alfabéticamente marcas
// sin una sola pieza). Los logos van en su color: un comercio los enseña como
// son, sin filtros de gris ni adornos.

const MAX_VISIBLES = 12;

export function GridMarcas({
  marcas,
}: {
  marcas: Array<Marca & { piezas: number }>;
}) {
  if (marcas.length === 0) return null;
  const visibles = marcas.slice(0, MAX_VISIBLES);

  return (
    <section
      aria-labelledby="marcas-titulo"
      className="border-y border-borde bg-fondo-hondo"
    >
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <h2
              id="marcas-titulo"
              className="titulo-display text-xl text-tinta md:text-[1.375rem]"
            >
              Marcas que surtimos
            </h2>
            <p className="mt-1 text-[13px] leading-snug text-tinta-suave">
              Toca tu marca y filtra por modelo y año. Precio con IVA a la vista.
            </p>
          </div>

          <Link
            href="/refacciones"
            className="inline-flex min-h-11 items-center gap-1.5 font-display text-sm font-bold uppercase tracking-wide text-tinta underline-offset-4 hover:underline"
          >
            Ver las {marcas.length} marcas
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>

        <ul className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5 lg:grid-cols-6">
          {visibles.map((m) => (
            <li key={m.id}>
              <Link
                href={`/refacciones/${slugificar(m.linea)}`}
                className="flex h-full flex-col items-center justify-start gap-2 rounded-lg border border-borde bg-superficie px-2 py-3 text-center transition-[border-color,box-shadow,transform] duration-150 hover:border-grafito hover:shadow-carta-alta motion-safe:hover:-translate-y-0.5"
              >
                {/* El logo es decorativo para el lector de pantalla: el nombre
                    de la marca va escrito justo debajo, no hay que leerlo dos
                    veces (y si el archivo falta, LogoMarca cae al nombre). */}
                <span
                  aria-hidden
                  className="flex h-9 w-full items-center justify-center md:h-10"
                >
                  <LogoMarca marca={m.linea} />
                </span>
                <span className="font-display text-[12px] font-bold uppercase leading-tight tracking-[0.06em] text-tinta sm:text-[13px]">
                  {m.linea}
                </span>
                <span className="num-tab font-mono text-[11px] leading-none text-tinta-suave">
                  {m.piezas.toLocaleString("es-MX")}{" "}
                  {m.piezas === 1 ? "pieza" : "piezas"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
