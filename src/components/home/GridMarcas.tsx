import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Marca } from "@/lib/catalogo";
import { slugificar } from "@/lib/slug";
import { LogoMarca } from "@/components/LogoMarca";

// Muro de placas sobre campo azul: el logo del fabricante manda y debajo va el
// contero real de piezas disponibles. Es la banda de campo azul de la mitad de
// la página — rompe la sucesión de papel sin gastar el bloque oscuro
// protagonista, y las placas blancas sostienen logos que en su mayoría son de
// tinta oscura.
//
// Solo entran las marcas que la tienda REALMENTE surte, ya ordenadas de mayor a
// menor por piezas desde la página. Los logos van en su color: un comercio los
// enseña como son, sin filtros de gris ni adornos.

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
      className="sobre-plano border-y border-white/15 bg-plano text-white"
    >
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-white/20 pb-3">
          <h2
            id="marcas-titulo"
            className="rotulo-tecnico text-[clamp(1.15rem,2.6vw,1.5rem)] leading-none text-white"
          >
            Marcas que surtimos
          </h2>
          <Link
            href="/refacciones"
            className="rotulo-tecnico inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[13px] text-white underline-offset-4 hover:underline"
          >
            Ver las {marcas.length} marcas
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>

        <p className="mt-3 max-w-[68ch] text-[14px] leading-snug text-white/75">
          Toca tu marca y filtra por modelo y año. Precio con IVA a la vista.
        </p>

        <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5 lg:grid-cols-6">
          {visibles.map((m) => (
            <li key={m.id}>
              <Link
                href={`/refacciones/${slugificar(m.linea)}`}
                className="lamina lamina-enlace flex h-full flex-col items-center justify-start gap-2 px-2 py-3 text-center"
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
                <span className="rotulo-tecnico text-[12px] leading-tight text-tinta sm:text-[13px]">
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
