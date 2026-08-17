import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PiezaUsadaResumen } from "@/lib/usadas";
import { TarjetaUsada } from "@/components/TarjetaUsada";

// Usadas recién entradas a la Bodega: vitrina, no sección de landing. Encabezado
// chico de un renglón con el enlace a /usadas y enseguida la mercancía, apretada
// (hasta 4 por renglón en desktop, 3 en tablet, 2 en móvil).
//
// La consulta vive en la página dentro de try/catch: si la base remota falla
// llega lista vacía y la sección entera se oculta sin romper la home.

export function UsadasRecientes({ piezas }: { piezas: PiezaUsadaResumen[] }) {
  if (piezas.length === 0) return null;

  return (
    <section aria-labelledby="usadas-titulo" className="bg-fondo">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <h2
              id="usadas-titulo"
              className="titulo-display text-xl text-tinta md:text-[1.375rem]"
            >
              Usadas recién entradas
            </h2>
            {/* El argumento de la casa: la foto es de la pieza exacta, no de
                catálogo. Va corto y pegado al título, no como bajada de landing. */}
            <p className="mt-1 text-[13px] leading-snug text-tinta-suave">
              Foto real de la pieza exacta que te llevas. Cada una es única: si te
              late, apártala.
            </p>
          </div>

          <Link
            href="/usadas"
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 font-display text-sm font-bold uppercase tracking-wide text-tinta underline-offset-4 hover:underline"
          >
            Ver todas las usadas
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:gap-3 lg:grid-cols-4">
          {piezas.slice(0, 8).map((p) => (
            <TarjetaUsada key={p.id} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
