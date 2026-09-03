import type { Metadata } from "next";
import { FileText, Phone, ShieldCheck, Store, Wrench } from "lucide-react";
import { NEGOCIO, PRELLENADOS, urlWhatsApp } from "@/config/negocio";
import { IconWhatsApp } from "@/components/IconWhatsApp";
import { QrWhatsApp } from "@/components/QrWhatsApp";
import { EncabezadoPagina } from "@/components/EncabezadoPagina";
import { TituloSeccion } from "@/components/TituloSeccion";

// Puerta B2B: talleres de hojalatería y pintura, refaccionarias y aseguradoras.
// Solo datos reales del negocio (nada de porcentajes de descuento inventados):
// trato de mayoreo, catálogo de 42,000+ códigos y factura CFDI 4.0.
//
// Los tres perfiles NO van en una parrilla de tarjetas iguales: van como los
// renglones de una hoja de especificación, separados por el filete del plano.
// Quien compra para trabajar lee listas, no mosaicos.

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
  "rotulo-tecnico inline-flex min-h-12 items-center justify-center gap-1.5 rounded-md border border-white/20 bg-white/5 px-6 text-sm text-white transition-colors duration-150 hover:border-white/50 hover:bg-white/10";

export default function PaginaMayoreo() {
  return (
    <>
      <EncabezadoPagina
        titulo="Mayoreo para talleres, refaccionarias y aseguradoras"
        descripcion="Si compras piezas de colisión para trabajar, te atendemos como negocio: precios de mayoreo, cotizaciones completas por valuación y factura en cada compra."
        migas={[{ nombre: "Inicio", href: "/" }, { nombre: "Mayoreo" }]}
      />

      <section className="bg-papel">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <TituloSeccion titulo="Tres formas de comprarnos como negocio" />

          <ul className="mt-8 divide-y divide-linea border-b border-linea">
            {PERFILES.map((p) => (
              <li
                key={p.titulo}
                className="grid gap-x-8 gap-y-2 py-7 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]"
              >
                <h3 className="flex items-start gap-2.5">
                  <p.icono
                    aria-hidden
                    className="mt-0.5 size-5 shrink-0 text-tinta-suave"
                  />
                  <span className="rotulo-tecnico text-lg leading-tight text-tinta">
                    {p.titulo}
                  </span>
                </h3>
                <p className="max-w-[68ch] text-[15px] leading-relaxed text-tinta-suave">
                  {p.texto}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Facturación: el dato duro que un comprador de negocio busca primero. */}
      <section className="border-y border-linea bg-hoja">
        <div className="mx-auto flex max-w-6xl items-start gap-5 px-4 py-12 md:items-center md:py-16">
          <span className="hidden size-14 shrink-0 items-center justify-center rounded-md border border-linea bg-papel md:inline-flex">
            <FileText aria-hidden className="size-6 text-tinta" />
          </span>
          <div>
            <h2 className="titulo-lamina text-[clamp(1.9rem,4.4vw,2.9rem)]">
              Facturamos CFDI 4.0
            </h2>
            <p className="mt-4 max-w-[68ch] text-[15px] leading-relaxed text-tinta-suave">
              Emitimos factura CFDI 4.0 por todas tus compras, de mostrador o de
              mayoreo. Compra como negocio con los papeles en regla.
            </p>
          </div>
        </div>
      </section>

      {/* CTA de conversión: WhatsApp primero, teléfono después, QR solo en
          escritorio. Sobre el campo azul el foco se dibuja en ámbar. */}
      <section className="sobre-plano relative isolate overflow-hidden bg-plano-hondo text-white">
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 py-14 md:flex-row md:items-center md:py-20">
          <div className="flex-1">
            <TituloSeccion
              titulo="Arranca con una cotización"
              descripcion="Mándanos tu lista de piezas o la valuación completa y te regresamos precios de mayoreo con IVA incluido."
              tono="oscuro"
            />
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={urlWhatsApp(PRELLENADOS.mayoreo)}
                target="_blank"
                rel="noopener noreferrer"
                className="rotulo-tecnico inline-flex min-h-12 items-center gap-2 rounded-md bg-whatsapp px-6 text-sm text-plano-hondo transition-[filter] duration-150 hover:brightness-95 active:brightness-90"
              >
                <IconWhatsApp lado={18} />
                Cotización de mayoreo por WhatsApp
              </a>
              <a href={`tel:${NEGOCIO.telefono}`} className={CLASE_BOTON_TEL}>
                <Phone aria-hidden className="size-4" />
                Llamar {NEGOCIO.telefonoBonito}
              </a>
            </div>
            <p className="mt-3.5 text-xs text-white/70">
              Vico te cotiza al momento, 24/7.
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
