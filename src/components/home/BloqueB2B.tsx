import Link from "next/link";
import { ArrowRight, FileText, Handshake, Phone, Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NEGOCIO } from "@/config/negocio";

// Bloque B2B para taller, refaccionaria y ajustadores de aseguradora: titular
// mediano, las ventajas en un renglón y, del lado derecho, las dos formas de
// entrarle — el trato de mayoreo y el teléfono en grande, que es como cotiza un
// negocio. Solo datos reales: mayoreo, CFDI 4.0, atención directa y cotización
// por valuación (lo mismo que publica /mayoreo).
//
// Va sobre el neutro hondo para separarse de las bandas blancas vecinas sin
// gastar otra banda grafito (la única de la home es la franja del asistente).

const CLASE_BOTON =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-borde bg-superficie px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-tinta transition-colors duration-150 hover:border-grafito";

const VENTAJAS: Array<{ icono: LucideIcon; texto: string }> = [
  { icono: Tag, texto: "Precios de mayoreo" },
  { icono: FileText, texto: "Factura CFDI 4.0" },
  { icono: Handshake, texto: "Atención directa en mostrador" },
];

export function BloqueB2B() {
  return (
    <section
      aria-labelledby="mayoreo-titulo"
      className="trama-rejilla border-y border-borde bg-fondo-hondo"
    >
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <div className="md:flex md:items-center md:justify-between md:gap-10">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2.5">
              <span aria-hidden className="h-px w-7 shrink-0 bg-borde-fuerte" />
              <span className="rotulo text-tinta-suave">Mayoreo</span>
            </p>
            <h2
              id="mayoreo-titulo"
              className="titulo-cartel mt-2 text-[clamp(1.5rem,3.4vw,2.1rem)] text-tinta"
            >
              ¿Tienes taller, refaccionaria o ajustas siniestros?
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-tinta-suave">
              Mándanos la valuación completa y te la cotizamos pieza por pieza,
              con precio de mayoreo y factura en cada compra.
            </p>

            <ul className="mt-3.5 flex flex-wrap gap-x-6 gap-y-2">
              {VENTAJAS.map((v) => (
                <li
                  key={v.texto}
                  className="flex items-center gap-2 text-sm font-semibold leading-tight"
                >
                  <v.icono aria-hidden className="size-4 shrink-0 text-tinta-suave" />
                  {v.texto}
                </li>
              ))}
            </ul>
          </div>

          {/* El teléfono en grande: un comprador de negocio marca, no llena
              formularios. Toda la tarjeta es el enlace tel:. */}
          <div className="mt-6 flex flex-col gap-2.5 md:mt-0 md:w-64 md:shrink-0">
            <Link href="/mayoreo" className={CLASE_BOTON}>
              Ver el trato de mayoreo
              <ArrowRight aria-hidden className="size-4" />
            </Link>
            <a
              href={`tel:${NEGOCIO.telefono}`}
              aria-label={`Llamar a Autopartes Vidaurri al ${NEGOCIO.telefonoBonito}`}
              className="flex items-center gap-3 rounded-lg border border-borde bg-superficie px-4 py-2.5 transition-colors duration-150 hover:border-grafito"
            >
              <Phone aria-hidden className="size-5 shrink-0 text-tinta-suave" />
              <span>
                <span className="rotulo block text-tinta-suave">Llámanos</span>
                <span className="titulo-display num-tab block text-xl leading-tight text-tinta">
                  {NEGOCIO.telefonoBonito}
                </span>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
