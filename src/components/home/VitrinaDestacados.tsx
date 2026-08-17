import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { JSX } from "react";
import type { ProductoResumen } from "@/lib/catalogo";
import { PRELLENADOS } from "@/config/negocio";
import { TarjetaProducto } from "@/components/TarjetaProducto";
import { LinkChat } from "@/components/home/LinkChat";

// La mercancía, lo más arriba posible de la home: piezas reales con precio con
// IVA a la vista. El encabezado es un renglón de cajetín —título a la izquierda,
// salida al catálogo a la derecha, filete debajo— y enseguida la lámina llena de
// piezas. Sin etiqueta-rótulo encima del título: el título carga solo.
//
// Sin ofertas, sin descuentos, sin precios tachados: no tenemos precios de lista
// promocionales. La única urgencia permitida es la existencia real, y va sellada
// con el sello de goma, no con un color de relleno.

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
  // entra una pieza sobre pedido, el letrero baja a la versión neutra. Va en dos
  // tiempos, como el letrero de la referencia: el hecho en blanco y la invitación
  // en oro.
  const todasEnPiso = lista.every((p) => p.enExistencia);
  const [tituloBlanco, tituloOro] = todasEnPiso
    ? ["En existencia", "recógela hoy"]
    : ["Nuestro catálogo", "con precio a la vista"];

  return (
    <section aria-labelledby="vitrina-titulo" className="bg-[#111116]">
      {/* EL LETRERO — banda carbón con el rótulo a la izquierda, la guía de oro
          cruzando el aire y la salida al catálogo a la derecha. */}
      <div className="sobre-plano bg-[#16181d] text-white border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-5">
          <div className="shrink-0">
            <h2
              id="vitrina-titulo"
              className="flex items-center gap-3 text-[clamp(1.3rem,3.2vw,1.85rem)] uppercase tracking-wide font-extrabold"
            >
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-full bg-ambar shadow-[0_0_12px_var(--color-ambar)]"
              />
              <span className="titulo-lamina text-white">
                EN EXISTENCIA
                <span aria-hidden className="mx-2 font-normal text-white/40">
                  —
                </span>
                <span className="text-[#f0d97d]">RECÓGELA HOY</span>
              </span>
            </h2>
            <p className="mt-1 pl-[22px] text-[12px] font-medium text-white/60">
              Precios con IVA incluido
            </p>
          </div>

          {/* La guía dorada ondulada */}
          <svg
            aria-hidden
            viewBox="0 0 400 24"
            preserveAspectRatio="none"
            className="hidden h-6 min-w-0 flex-1 lg:block"
          >
            <path
              d="M0 13 C 90 13, 120 4, 210 4 S 320 15, 400 15"
              fill="none"
              stroke="url(#metal-vidaurri)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          <Link
            href="/refacciones"
            className="rotulo-tecnico ml-auto inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-ambar/70 px-5 text-[12px] font-bold uppercase text-white shadow-[0_2px_10px_rgba(0,0,0,0.3)] transition-all duration-150 hover:border-ambar hover:bg-ambar/15 lg:ml-0"
          >
            <span>VER TODO EL CATÁLOGO</span>
            <ArrowRight aria-hidden className="size-4 shrink-0 text-ambar" />
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
          {lista.map((p) => (
            <TarjetaProducto key={p.codigo} p={p} />
          ))}
        </div>

        {/* Rescate conversacional: la vitrina es una muestra, el catálogo no.
            Ninguna búsqueda termina en pared. */}
        <div className="lamina mt-5 px-4 py-4 text-center">
          <p className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[15px] text-tinta-suave">
            <span>¿No ves la tuya? Tenemos más de 40,000 piezas.</span>
            <LinkChat mensaje={PRELLENADOS.generico}>
              Dile a Vico qué buscas
              <ArrowRight aria-hidden className="size-4 shrink-0" />
            </LinkChat>
          </p>
          <p className="mt-1 text-[12.5px] text-tinta-suave">
            El asistente cotiza 24/7 y te pasa el precio con IVA incluido.
          </p>
        </div>
      </div>
    </section>
  );
}
