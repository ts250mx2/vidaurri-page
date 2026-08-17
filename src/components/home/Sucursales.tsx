import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NEGOCIO } from "@/config/negocio";
import { TarjetaSucursal } from "@/components/TarjetaSucursal";

// Cierre de la home: dónde recoger hoy. Renglón de cajetín con la salida a
// /sucursales y las dos fichas — la misma TarjetaSucursal de /sucursales, con
// los datos TAL CUAL de src/config/negocio.ts (dirección, horario, cómo llegar
// y llamar). Aquí no se agrega ni se completa nada: los datos marcados
// PENDIENTE siguen pendientes hasta que el cliente los confirme.

export function Sucursales() {
  return (
    <section aria-labelledby="sucursales-titulo" className="bg-papel">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-linea-fuerte pb-3">
          <h2
            id="sucursales-titulo"
            className="rotulo-tecnico text-[clamp(1.15rem,2.6vw,1.5rem)] leading-none text-tinta"
          >
            Recoge hoy en Monterrey
          </h2>
          <Link
            href="/sucursales"
            className="rotulo-tecnico inline-flex min-h-11 shrink-0 items-center gap-1.5 text-[13px] text-tinta underline-offset-4 hover:underline"
          >
            Horarios y cómo llegar
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 md:gap-4">
          {NEGOCIO.sucursales.map((s, i) => (
            <TarjetaSucursal key={s.nombre} sucursal={s} indice={i} />
          ))}
        </div>

        <p className="mt-4 max-w-[68ch] text-[13px] leading-snug text-tinta-suave">
          Cotiza por chat o WhatsApp, apártala y pasa por ella el mismo día. Si no
          puedes venir, acordamos el envío.
        </p>
      </div>
    </section>
  );
}
