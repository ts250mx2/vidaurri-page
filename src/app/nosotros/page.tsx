import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Boxes, Camera, Check, History, Store, Tags } from "lucide-react";
import { resumenCatalogo } from "@/lib/catalogo";
import { resumenBodega } from "@/lib/usadas";
import { NEGOCIO } from "@/config/negocio";
import { BotonCotizar } from "@/components/BotonCotizar";
import { EncabezadoPagina } from "@/components/EncabezadoPagina";
import { TableroCifras, type CifraCasa } from "@/components/TableroCifras";
import { TituloSeccion } from "@/components/TituloSeccion";

// Historia sobria basada SOLO en lo público del negocio: importación,
// comercialización y distribución de refacciones de colisión nuevas y usadas
// en Monterrey, para talleres, refaccionarias, aseguradoras y público. Sin
// fechas exactas ni fundadores (no los conocemos). Las cifras salen de las
// bases reales y se omiten si alguna no responde: nunca se inventan.

export const metadata: Metadata = {
  title:
    "Nosotros: más de 40 años de refacciones de colisión en Monterrey",
  description:
    "Autopartes Vidaurri lleva más de 40 años importando, comercializando y distribuyendo refacciones de colisión nuevas y usadas en Monterrey: facias, cofres, faros, calaveras y más, para talleres, refaccionarias, aseguradoras y público.",
  alternates: { canonical: "/nosotros" },
};

const RAZONES = [
  "Pagas precio de refaccionaria, no de agencia: la misma pieza de colisión sin el sobreprecio del concesionario.",
  "Nueva, usada o sobre pedido: tres formas de resolver el mismo golpe según tu presupuesto.",
  "Las usadas van con fotos reales: ves la pieza exacta que te llevas, no una foto de catálogo.",
  "Factura CFDI 4.0 en todas tus compras, de mostrador o de mayoreo.",
  `${NEGOCIO.asistente}, el asistente de la casa, te cotiza 24/7 por chat o WhatsApp con el catálogo real de la tienda.`,
] as const;

export default async function PaginaNosotros() {
  // Cifras reales; cada consulta degrada por separado (la Bodega es remota).
  const [catalogo, bodega] = await Promise.all([
    resumenCatalogo().catch(() => null),
    resumenBodega().catch(() => null),
  ]);

  const fmt = (n: number) => n.toLocaleString("es-MX");
  const cifras: CifraCasa[] = [
    { icono: History, cifra: "40+", texto: "años en Monterrey" },
    ...(catalogo && catalogo.piezasNuevas > 0
      ? [{ icono: Boxes, cifra: fmt(catalogo.piezasNuevas), texto: "piezas nuevas" }]
      : []),
    ...(catalogo && catalogo.marcas > 0
      ? [{ icono: Tags, cifra: String(catalogo.marcas), texto: "marcas de auto" }]
      : []),
    ...(bodega && bodega.piezas > 0
      ? [{ icono: Camera, cifra: fmt(bodega.piezas), texto: "usadas con foto real" }]
      : []),
    {
      icono: Store,
      cifra: String(NEGOCIO.sucursales.length),
      texto: "sucursales — recoge hoy",
    },
  ];

  return (
    <>
      <EncabezadoPagina
        titulo="Más de 40 años en el mostrador"
        descripcion="Importamos, comercializamos y distribuimos refacciones de colisión en Monterrey. El oficio es el mismo de siempre: encontrar la pieza correcta al precio justo."
        migas={[{ nombre: "Inicio", href: "/" }, { nombre: "Nosotros" }]}
      />

      <section className="bg-papel">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <div className="max-w-[68ch] space-y-5 text-[15px] leading-relaxed">
            <p>
              Autopartes Vidaurri lleva más de 40 años importando,
              comercializando y distribuyendo refacciones automotrices de
              colisión en Monterrey: las piezas que un golpe daña primero —
              facias (defensas), cofres (capós), faros, calaveras (stops),
              salpicaderas (aletas), espejos y parrillas.
            </p>
            <p>
              Vendemos piezas nuevas y usadas a talleres de hojalatería y
              pintura, refaccionarias, aseguradoras y al público que llega con
              su carro chocado y quiere resolverlo ya.
            </p>
            <p>
              El oficio es el mismo de siempre: encontrar la pieza correcta al
              precio justo. Lo que cambió es que hoy también la buscas en
              línea, con el precio con IVA a la vista, y la recoges el mismo
              día en sucursal.
            </p>
          </div>
        </div>
      </section>

      <TableroCifras datos={cifras} etiqueta="La casa en números" />

      <section className="bg-papel">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <TituloSeccion titulo="Por qué comprarnos" />

          {/* Lista de especificación, no parrilla de tarjetas: un renglón por
              razón, separados por el filete del plano. */}
          <ul className="mt-8 max-w-[72ch] divide-y divide-linea border-b border-linea">
            {RAZONES.map((r) => (
              <li
                key={r}
                className="flex items-start gap-3 py-4 text-[15px] leading-relaxed"
              >
                <Check
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-existencia"
                />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA final: chat ámbar (2º nivel) + catálogo neutro (4º nivel). */}
      <section className="border-t border-linea bg-hoja">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <TituloSeccion titulo="¿Chocaste? Empieza por tu pieza" />
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <BotonCotizar
              mensaje="Hola, quiero cotizar una pieza. Mi auto es: "
              className="min-h-12 px-6"
            >
              Cotizar por chat
            </BotonCotizar>
            <Link
              href="/refacciones"
              className="rotulo-tecnico inline-flex min-h-12 items-center justify-center gap-1.5 rounded-md border border-linea bg-hoja px-5 text-sm text-tinta transition-colors duration-150 hover:border-tinta hover:bg-papel"
            >
              Ver el catálogo
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
          <p className="mt-3.5 text-xs text-tinta-suave">
            El asistente cotiza 24/7.
          </p>
        </div>
      </section>
    </>
  );
}
