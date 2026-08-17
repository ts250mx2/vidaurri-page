import Link from "next/link";
import { ArrowRight, FileText, Handshake, Phone, Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { IconWhatsApp } from "@/components/IconWhatsApp";
import { NEGOCIO, PRELLENADOS, urlWhatsApp } from "@/config/negocio";

// LAS DOS PUERTAS: el bloque oscuro protagonista de la home. El negocio le habla
// por igual al particular que chocó y al taller o refaccionaria de mayoreo, así
// que el mayoreo dejó de ser la nota al pie de la página y pasó a ser la mitad
// de una lámina de campo azul, con su propio ámbar y su teléfono en grande —que
// es como cotiza un negocio.
//
// Solo datos reales: mayoreo, CFDI 4.0, atención directa y cotización por
// valuación completa, lo mismo que publica /mayoreo. Ninguna promesa de plazo,
// descuento ni volumen.

const CLASE_AMBAR =
  "rotulo-tecnico inline-flex min-h-11 items-center gap-2 rounded-md bg-ambar px-5 text-sm text-plano-hondo transition-colors duration-150 hover:bg-ambar-press";

const CLASE_WHATSAPP =
  "rotulo-tecnico inline-flex min-h-11 items-center gap-2 rounded-md bg-whatsapp px-5 text-sm text-plano-hondo transition-[filter] duration-150 hover:brightness-95 active:brightness-90";

const CLASE_CONTORNO =
  "rotulo-tecnico inline-flex min-h-11 items-center gap-2 rounded-md border border-white/30 px-4 text-sm text-white transition-colors duration-150 hover:border-white/70 hover:bg-white/10";

const VENTAJAS: Array<{ icono: LucideIcon; texto: string }> = [
  { icono: Tag, texto: "Precios de mayoreo" },
  { icono: FileText, texto: "Factura CFDI 4.0" },
  { icono: Handshake, texto: "Atención directa en mostrador" },
];

export function BloqueB2B() {
  return (
    <section
      aria-labelledby="puertas-titulo"
      className="sobre-plano relative isolate overflow-hidden border-y border-white/15 bg-plano-hondo text-white"
    >

      <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-16">
        <h2
          id="puertas-titulo"
          className="titulo-lamina max-w-[18ch] text-[clamp(1.8rem,4.4vw,2.75rem)]"
        >
          ¿Es para tu carro o para tu taller?
        </h2>
        <p className="mt-4 max-w-[68ch] text-[15px] leading-relaxed text-white/75">
          El mismo anaquel atiende dos negocios distintos: el que chocó su carro
          y el que vive de repararlos. Elige tu puerta.
        </p>

        <div className="mt-9 grid md:grid-cols-2">
          {/* Puerta 1: el particular. */}
          <div className="border-b border-white/15 pb-8 md:border-b-0 md:border-r md:pb-0 md:pr-10">
            <h3 className="rotulo-tecnico text-[clamp(1.05rem,2.2vw,1.3rem)] text-white">
              Chocaste tu carro
            </h3>
            <p className="mt-2.5 max-w-[62ch] text-[15px] leading-relaxed text-white/75">
              Busca la pieza por marca, modelo y año, con el precio con IVA a la
              vista. Y si no sabes cómo se llama, descríbela como la ves: “el
              plástico de adelante” nos basta.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <a
                href={urlWhatsApp(PRELLENADOS.generico)}
                target="_blank"
                rel="noopener noreferrer"
                className={CLASE_WHATSAPP}
              >
                <IconWhatsApp lado={18} />
                Cotiza por WhatsApp
              </a>
              <Link href="/refacciones" className={CLASE_CONTORNO}>
                Busca en el catálogo
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
            <p className="mt-3 max-w-[52ch] text-[12.5px] leading-snug text-white/60">
              {NEGOCIO.asistente} contesta al momento, todos los días, con el
              precio con IVA incluido.
            </p>
          </div>

          {/* Puerta 2: taller, refaccionaria y ajustadores. Lleva el ámbar de la
              lámina: es la puerta que la portada tenía escondida. */}
          <div className="pt-8 md:pl-10 md:pt-0">
            <h3 className="rotulo-tecnico text-[clamp(1.05rem,2.2vw,1.3rem)] text-white">
              Tienes taller, refaccionaria o ajustas siniestros
            </h3>
            <p className="mt-2.5 max-w-[62ch] text-[15px] leading-relaxed text-white/75">
              Mándanos la valuación completa y te la cotizamos pieza por pieza,
              con precio de mayoreo y factura en cada compra.
            </p>

            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {VENTAJAS.map((v) => (
                <li
                  key={v.texto}
                  className="flex items-center gap-2 text-[13.5px] font-medium leading-tight text-white/85"
                >
                  <v.icono aria-hidden className="size-4 shrink-0 text-white/55" />
                  {v.texto}
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <Link href="/mayoreo" className={CLASE_AMBAR}>
                Ver el trato de mayoreo
                <ArrowRight aria-hidden className="size-4" />
              </Link>
              <a
                href={urlWhatsApp(PRELLENADOS.mayoreo)}
                target="_blank"
                rel="noopener noreferrer"
                className={CLASE_WHATSAPP}
              >
                <IconWhatsApp lado={18} />
                Manda tu valuación
              </a>
            </div>
            <p className="mt-3 max-w-[52ch] text-[12.5px] leading-snug text-white/60">
              Te la cotizamos pieza por pieza en el mismo chat de WhatsApp.
            </p>

            {/* Un comprador de negocio marca, no llena formularios. */}
            <a
              href={`tel:${NEGOCIO.telefono}`}
              aria-label={`Llamar a ${NEGOCIO.nombre} al ${NEGOCIO.telefonoBonito}`}
              className="mt-4 inline-flex min-h-11 items-center gap-3 rounded-md border border-white/20 px-4 py-2 transition-colors duration-150 hover:border-white/60"
            >
              <Phone aria-hidden className="size-4 shrink-0 text-white/60" />
              <span className="num-tab font-mono text-[17px] font-semibold text-white">
                {NEGOCIO.telefonoBonito}
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
