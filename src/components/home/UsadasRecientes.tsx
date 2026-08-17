import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PiezaUsadaResumen } from "@/lib/usadas";
import { TarjetaUsada } from "@/components/TarjetaUsada";

// Usadas recién entradas a la Bodega: mercancía, no sección de landing. Renglón
// de cajetín con el sello rojo de anotación —cada usada es única e irrepetible,
// y esa es la única escasez que este sitio tiene derecho a decir— y enseguida la
// lámina llena de piezas con su foto real.
//
// La consulta vive en la página dentro de try/catch: si la base remota falla
// llega lista vacía y la sección entera se oculta sin romper la home.

const MAXIMO_PIEZAS = 8;

export function UsadasRecientes({ piezas }: { piezas: PiezaUsadaResumen[] }) {
  if (piezas.length === 0) return null;

  return (
    <section
      aria-labelledby="usadas-titulo"
      className="border-y border-linea bg-papel-hondo"
    >
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-linea-fuerte pb-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h2
              id="usadas-titulo"
              className="rotulo-tecnico text-[clamp(1.15rem,2.6vw,1.5rem)] leading-none text-tinta"
            >
              Usadas recién entradas
            </h2>
            {/* Sobre papelito blanco: la tinta de anotación sobre el papel
                hondo se queda en 3.7:1 y esto se lee al sol. */}
            <span className="sello sello-unica bg-hoja">Pieza única</span>
          </div>

          <Link
            href="/usadas"
            className="rotulo-tecnico inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[13px] text-tinta underline-offset-4 hover:underline"
          >
            <span className="sm:hidden">Ver todas</span>
            <span className="hidden sm:inline">Ver todas las usadas</span>
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>

        {/* El argumento de la casa, en un renglón: la foto es de la pieza exacta
            que se entrega, no de catálogo. */}
        <p className="mt-3 max-w-[68ch] text-[14px] leading-snug text-tinta-suave">
          La foto es de la pieza exacta que te llevas. Cada una es de una sola
          unidad: si te late, apártala.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {piezas.slice(0, MAXIMO_PIEZAS).map((p, i) => (
            <TarjetaUsada key={p.id} p={p} indice={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
