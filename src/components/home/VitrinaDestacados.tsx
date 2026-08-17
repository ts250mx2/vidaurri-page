import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { JSX } from "react";
import type { ProductoResumen } from "@/lib/catalogo";
import { PRELLENADOS } from "@/config/negocio";
import { TarjetaProducto } from "@/components/TarjetaProducto";
import { LinkChat } from "@/components/home/LinkChat";

// Vitrina del mostrador: mercancía real con precio a la vista, lo más arriba
// posible de la home. A propósito NO usa `TituloSeccion` — el rótulo + titular
// gigante se repite en todas las demás secciones y ahí es donde la página deja
// de parecer tienda. Aquí manda una barra de anaquel compacta, como el letrero
// que cuelga sobre la estantería de una refaccionaria: título a la izquierda,
// "ver todo" a la derecha, y debajo la mercancía apretada.
//
// Sin ofertas, sin descuentos, sin precios tachados: no tenemos precios de
// lista promocionales. La única urgencia permitida es la existencia real.

/** 12 piezas llenan parejo el grid en sus tres anchos (2, 3 y 4 columnas). */
const MAXIMO_PIEZAS = 12;

export function VitrinaDestacados({
  productos,
}: {
  productos: ProductoResumen[];
}): JSX.Element | null {
  if (productos.length === 0) return null;

  // Lo que está en piso primero: una tienda enseña antes lo que puedes recoger
  // hoy que lo que hay que pedir. El orden relativo del catálogo se respeta.
  const lista = [
    ...productos.filter((p) => p.enExistencia),
    ...productos.filter((p) => !p.enExistencia),
  ].slice(0, MAXIMO_PIEZAS);

  // El titular solo promete existencia cuando TODO lo que se ve la tiene; si
  // entra una pieza sobre pedido, el letrero baja a la versión neutra.
  const todasEnPiso = lista.every((p) => p.enExistencia);
  const titulo = todasEnPiso
    ? "En existencia — recógela hoy"
    : "Lo que hay en el mostrador";

  return (
    <section
      aria-labelledby="vitrina-titulo"
      className="border-y border-borde bg-fondo-hondo"
    >
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        {/* Letrero de anaquel: encabezado de una sola línea, sin descripción. */}
        <div className="sobre-grafito trama-rejilla-oscura flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl bg-grafito px-4 py-2.5 md:px-5">
          <div className="flex items-center gap-2.5">
            {todasEnPiso && (
              <span aria-hidden className="size-2 shrink-0 rounded-full bg-exito" />
            )}
            <h2
              id="vitrina-titulo"
              className="titulo-display text-[clamp(1.05rem,2.4vw,1.5rem)] leading-none text-white"
            >
              {titulo}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <p className="hidden text-[13px] text-slate-300 sm:block">
              Precios con IVA incluido
            </p>
            <Link
              href="/refacciones"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-white/25 px-3 font-display text-sm font-bold uppercase tracking-wide text-white transition-colors duration-150 hover:bg-white/10"
            >
              <span className="sm:hidden">Ver todo</span>
              <span className="hidden sm:inline">Ver todo el catálogo</span>
              <ArrowRight aria-hidden className="size-4 shrink-0" />
            </Link>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {lista.map((p) => (
            <TarjetaProducto key={p.codigo} p={p} />
          ))}
        </div>

        {/* Rescate conversacional: la vitrina es una muestra, el catálogo no. */}
        <div className="carta mt-4 px-4 py-3.5 text-center">
          <p className="flex flex-wrap items-center justify-center gap-x-2 text-[15px] text-tinta-suave">
            <span>¿No ves la tuya? Tenemos más de 40,000 piezas —</span>
            <LinkChat mensaje={PRELLENADOS.generico} className="min-h-11">
              Dile a Vico qué buscas
              <ArrowRight aria-hidden className="size-4 shrink-0" />
            </LinkChat>
          </p>
          <p className="text-[12.5px] text-tinta-suave">El asistente cotiza 24/7</p>
        </div>
      </div>
    </section>
  );
}
