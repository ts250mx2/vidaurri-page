import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NEGOCIO } from "@/config/negocio";
import { TarjetaSucursal } from "@/components/TarjetaSucursal";

// Cierre de la home: dónde recoger hoy. Encabezado chico de un renglón con el
// enlace a /sucursales y las dos fichas — la misma TarjetaSucursal de
// /sucursales, con los datos TAL CUAL de src/config/negocio.ts (dirección,
// horario, cómo llegar y llamar). Aquí no se agrega ni se completa nada.

export function Sucursales() {
  return (
    <section aria-labelledby="sucursales-titulo" className="bg-fondo">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-borde pb-2.5">
          <h2
            id="sucursales-titulo"
            className="titulo-display text-xl text-tinta md:text-[1.375rem]"
          >
            Recoge hoy en Monterrey
          </h2>
          <Link
            href="/sucursales"
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 font-display text-sm font-bold uppercase tracking-wide text-tinta underline-offset-4 hover:underline"
          >
            Horarios y cómo llegar
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 md:gap-4">
          {NEGOCIO.sucursales.map((s, i) => (
            <TarjetaSucursal key={s.nombre} sucursal={s} indice={i} />
          ))}
        </div>

        <p className="mt-4 text-[13px] leading-snug text-tinta-suave">
          Cotiza por chat o WhatsApp, apártala y pasa por ella el mismo día. Si no
          puedes venir, acordamos el envío.
        </p>
      </div>
    </section>
  );
}
