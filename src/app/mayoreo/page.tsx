import type { Metadata } from "next";
import { FileText, Phone, ShieldCheck, Store, Wrench } from "lucide-react";
import { NEGOCIO, PRELLENADOS, urlWhatsApp } from "@/config/negocio";
import { IconWhatsApp } from "@/components/IconWhatsApp";
import { QrWhatsApp } from "@/components/QrWhatsApp";
import { EncabezadoPagina } from "@/components/EncabezadoPagina";
import { TituloSeccion } from "@/components/TituloSeccion";

// Puerta B2B: talleres de hojalatería y pintura, refaccionarias y aseguradoras.
// Solo datos reales del negocio (nada de cifras de descuento inventadas): trato
// de mayoreo, catálogo de 42,000+ códigos y factura CFDI 4.0.

export const metadata: Metadata = {
  title: {
    absolute:
      "Mayoreo de autopartes de colisión para talleres | Autopartes Vidaurri Monterrey",
  },
  description:
    "Surte tu taller, refaccionaria o cartera de siniestros con más de 42,000 códigos de colisión: facias, cofres, faros, calaveras y más. Precios de mayoreo, factura CFDI 4.0 y cotización de valuaciones completas por WhatsApp. Monterrey, N.L.",
  alternates: { canonical: "/mayoreo" },
};

const PERFILES = [
  {
    icono: Wrench,
    titulo: "Talleres de hojalatería y pintura",
    texto:
      "Surtido de colisión completo para sacar el golpe entero en un solo lugar: facias (defensas), cofres, faros, calaveras, salpicaderas, parrillas y más. Mándanos la valuación por WhatsApp y te cotizamos la lista completa, pieza por pieza.",
  },
  {
    icono: Store,
    titulo: "Refaccionarias",
    texto:
      "Precios de mayoreo sobre un catálogo de más de 42,000 códigos de colisión nuevos. Surte tu mostrador con un solo proveedor que lleva más de 40 años importando y distribuyendo en Monterrey.",
  },
  {
    icono: ShieldCheck,
    titulo: "Aseguradoras y ajustadores",
    texto:
      "Atención directa para ajustadores y valuadores: mándanos la valuación del siniestro y te regresamos la cotización completa, con el precio de cada pieza y su disponibilidad.",
  },
] as const;

const CLASE_BOTON_TEL =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-6 py-3.5 font-display text-sm font-bold uppercase tracking-wide text-white transition-colors duration-150 hover:border-white/40";

export default function PaginaMayoreo() {
  return (
    <>
      <EncabezadoPagina
        rotulo="Negocio a negocio"
        titulo="Mayoreo para talleres, refaccionarias y aseguradoras"
        descripcion="Si compras piezas de colisión para trabajar, te atendemos como negocio: precios de mayoreo, cotizaciones completas por valuación y factura en cada compra."
        migas={[{ nombre: "Inicio", href: "/" }, { nombre: "Mayoreo" }]}
      />

      <section className="bg-fondo">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <TituloSeccion
            rotulo="A quién surtimos"
            titulo="Tres formas de comprarnos como negocio"
          />

          <div className="mt-8 grid gap-3 md:grid-cols-3 md:gap-4">
            {PERFILES.map((p, i) => (
              <article
                key={p.titulo}
                className="carta relative flex flex-col overflow-hidden p-6"
              >
                <span
                  aria-hidden
                  className="titulo-cartel pointer-events-none absolute -top-3 right-3 select-none text-[5.5rem] text-tinta/[0.055]"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="inline-flex size-11 items-center justify-center rounded-lg border border-borde bg-fondo">
                  <p.icono aria-hidden className="size-5 text-tinta" />
                </span>
                <h2 className="titulo-display mt-4 text-xl">{p.titulo}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-tinta-suave">
                  {p.texto}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Facturación: el dato duro que un comprador de negocio busca primero. */}
      <section className="trama-rejilla border-y border-borde bg-superficie">
        <div className="mx-auto flex max-w-6xl items-start gap-5 px-4 py-12 md:items-center md:py-14">
          <span className="hidden size-14 shrink-0 items-center justify-center rounded-xl border border-borde bg-fondo md:inline-flex">
            <FileText aria-hidden className="size-6 text-tinta" />
          </span>
          <div>
            <h2 className="titulo-cartel text-[clamp(1.9rem,4.4vw,2.9rem)]">
              <span className="marcador-ambar">Facturamos CFDI 4.0</span>
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-tinta-suave">
              Emitimos factura CFDI 4.0 por todas tus compras, de mostrador o de
              mayoreo. Compra como negocio con los papeles en regla.
            </p>
          </div>
        </div>
      </section>

      {/* CTA de conversión: WhatsApp primero, teléfono después, QR solo desktop. */}
      <section className="sobre-grafito relative isolate overflow-hidden border-y-4 border-ambar bg-grafito-hondo text-white">
        <span
          aria-hidden
          className="trama-rejilla-oscura absolute inset-0 opacity-70"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-14 md:flex-row md:items-center md:py-20">
          <div className="flex-1">
            <TituloSeccion
              rotulo="Siguiente paso"
              titulo="Arranca con una cotización"
              descripcion="Mándanos tu lista de piezas o la valuación completa y te regresamos precios de mayoreo con IVA incluido."
              tono="oscuro"
            />
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={urlWhatsApp(PRELLENADOS.mayoreo)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-whatsapp px-6 py-3.5 font-display text-sm font-bold uppercase tracking-wide text-white transition-opacity duration-150 hover:opacity-90"
              >
                <IconWhatsApp lado={18} />
                Cotización de mayoreo por WhatsApp
              </a>
              <a href={`tel:${NEGOCIO.telefono}`} className={CLASE_BOTON_TEL}>
                <Phone aria-hidden className="size-4" />
                Llamar {NEGOCIO.telefonoBonito}
              </a>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Respondemos en minutos en horario hábil.
            </p>
          </div>

          {/* QR nunca en móvil: ahí ya está el botón wa.me directo. */}
          <div className="hidden md:block md:w-64 md:shrink-0">
            <QrWhatsApp
              texto={PRELLENADOS.mayoreo}
              leyenda="Escanéalo con tu cámara y pide tu cotización de mayoreo"
            />
          </div>
        </div>
      </section>
    </>
  );
}
