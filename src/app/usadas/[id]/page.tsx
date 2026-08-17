import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone } from "lucide-react";
import {
  listarMarcasUsadas,
  piezaUsadaPorId,
  type PiezaUsadaDetalle,
} from "@/lib/usadas";
import { rangoAnios } from "@/lib/formato";
import { NEGOCIO, PRELLENADOS, urlSitio, urlWhatsApp } from "@/config/negocio";
import { Precio } from "@/components/Precio";
import { BotonCotizar } from "@/components/BotonCotizar";
import { IconWhatsApp } from "@/components/IconWhatsApp";
import { QrWhatsApp } from "@/components/QrWhatsApp";
import { Migas } from "@/components/Migas";
import { GaleriaUsada } from "@/components/usadas/GaleriaUsada";
import { RescateUsadas } from "@/components/usadas/RescateUsadas";

// Ficha de pieza usada: galeria de fotos reales, precio con IVA (o "pregunta
// el precio"), escasez legitima de pieza unica y rescate si la Bodega remota
// no responde. cache() dedupe la consulta entre generateMetadata y la pagina.

interface CargaPieza {
  pieza: PiezaUsadaDetalle | null;
  /** true si la Bodega remota no respondio (distinto de "no existe"). */
  bodegaCaida: boolean;
}

const cargarPieza = cache(async (id: number): Promise<CargaPieza> => {
  try {
    return { pieza: await piezaUsadaPorId(id), bodegaCaida: false };
  } catch {
    return { pieza: null, bodegaCaida: true };
  }
});

function nombreCompleto(pieza: PiezaUsadaDetalle): {
  vehiculo: string;
  nombre: string;
} {
  const vehiculo = [pieza.marca, pieza.modelo].filter(Boolean).join(" ");
  return { vehiculo, nombre: `${pieza.descripcion}${vehiculo ? ` ${vehiculo}` : ""}` };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { pieza } = await cargarPieza(Number(id));
  if (!pieza) return { title: "Pieza usada" };

  const { vehiculo } = nombreCompleto(pieza);
  const anios = rangoAnios(pieza.anioInicio, pieza.anioFin);
  const fotoAbsoluta = pieza.fotos[0]
    ? `${urlSitio()}/api/usadas/foto?n=${encodeURIComponent(pieza.fotos[0])}`
    : undefined;

  return {
    title: {
      absolute: `${pieza.descripcion} usada${vehiculo ? ` ${vehiculo}` : ""} | Foto real y precio | Autopartes Vidaurri`,
    },
    description: `${pieza.descripcion} usada${vehiculo ? ` para ${vehiculo}` : ""}${anios ? ` (${anios})` : ""}. Pieza única con foto real de lo que recibes.${pieza.precioConIva ? " Precio con IVA incluido." : " Pregunta el precio por WhatsApp o chat."} Autopartes Vidaurri, Monterrey.`,
    openGraph: fotoAbsoluta ? { images: [fotoAbsoluta] } : undefined,
  };
}

export default async function PaginaPiezaUsada({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { pieza, bodegaCaida } = await cargarPieza(Number(id));

  if (!pieza && bodegaCaida) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 md:py-16">
        <h1 className="sr-only">Pieza usada</h1>
        <RescateUsadas
          titulo="La bodega de usadas no está respondiendo en este momento"
          descripcion="No eres tú, es nuestro sistema. Mándanos la liga de la pieza y te decimos al momento si sigue disponible."
          textoWhatsApp={`Hola, vi una pieza usada en su página pero no me cargó (liga: ${urlSitio()}/usadas/${Number(id) || ""}). ¿Sigue disponible?`}
          mensajeChat={`La ficha de la pieza usada /usadas/${Number(id) || ""} no me cargó. ¿Me dices si sigue disponible?`}
        />
        <p className="mt-6 text-center text-sm">
          <Link
            href="/usadas"
            className="font-semibold underline decoration-ambar decoration-2 underline-offset-4 transition-colors duration-150 hover:text-ambar-press"
          >
            Ver todas las piezas usadas
          </Link>
        </p>
      </div>
    );
  }
  if (!pieza) notFound();

  const { vehiculo, nombre } = nombreCompleto(pieza);
  const anios = rangoAnios(pieza.anioInicio, pieza.anioFin);
  const textoWhatsApp = PRELLENADOS.usada(nombre, pieza.codigo);

  // El detalle no trae el id de la marca: se resuelve contra el catalogo de
  // marcas (cacheado) para armar el link filtrado; si falla, cae a busqueda
  // por texto. Nunca rompe la ficha.
  const marcas = await listarMarcasUsadas().catch(() => []);
  const idMarca = marcas.find((m) => m.marca === pieza.marca)?.id;
  const hrefMarca = idMarca
    ? `/usadas?marca=${idMarca}`
    : pieza.marca
      ? `/usadas?texto=${encodeURIComponent(pieza.marca)}`
      : "/usadas";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: nombre,
    sku: pieza.codigo,
    description: `${pieza.descripcion} usada${vehiculo ? ` para ${vehiculo}` : ""}${anios ? ` (${anios})` : ""}, con foto real de la pieza exacta.`,
    itemCondition: "https://schema.org/UsedCondition",
    ...(pieza.fotos[0] && {
      image: `${urlSitio()}/api/usadas/foto?n=${encodeURIComponent(pieza.fotos[0])}`,
    }),
    ...(pieza.marca && { brand: { "@type": "Brand", name: pieza.marca } }),
    offers: {
      "@type": "Offer",
      url: `${urlSitio()}/usadas/${pieza.id}`,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/UsedCondition",
      ...(pieza.precioConIva && {
        price: pieza.precioConIva.toFixed(2),
        priceCurrency: "MXN",
      }),
    },
  };

  return (
    <>
      <div className="border-b border-borde bg-superficie">
        <Migas
          items={[
            { nombre: "Inicio", href: "/" },
            { nombre: "Usadas", href: "/usadas" },
            { nombre: pieza.descripcion },
          ]}
          className="mx-auto max-w-6xl px-4 py-3.5"
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-10">
          <GaleriaUsada fotos={pieza.fotos} descripcion={pieza.descripcion} />

          <div>
            <span className="inline-block rounded-md bg-ambar px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-grafito">
              Usada
            </span>

            <h1 className="titulo-cartel mt-3 text-[clamp(1.75rem,4.2vw,2.5rem)]">
              {pieza.descripcion}
            </h1>
            <p className="num-tab mt-2 font-mono text-sm text-tinta-suave">
              SKU: {pieza.codigo}
            </p>

            {vehiculo ? (
              <p className="mt-3 text-[15px] leading-relaxed">
                Le queda a{" "}
                <Link
                  href={hrefMarca}
                  className="font-semibold underline decoration-ambar decoration-2 underline-offset-4 transition-colors duration-150 hover:text-ambar-press"
                >
                  {vehiculo}
                </Link>
                {anios && (
                  <span className="num-tab text-tinta-suave"> · modelos {anios}</span>
                )}
              </p>
            ) : (
              anios && (
                <p className="num-tab mt-3 text-[15px] text-tinta-suave">
                  Modelos {anios}
                </p>
              )
            )}

            <div className="carta mt-6 overflow-hidden border-l-4 border-l-ambar">
              <div className="p-5">
                {pieza.precioConIva ? (
                  <Precio monto={pieza.precioConIva} tam="lg" />
                ) : (
                  <p className="titulo-cartel text-2xl leading-tight">
                    Pregunta el precio — te contestamos al momento
                  </p>
                )}
              </div>
              <p className="flex items-center gap-2.5 border-t border-borde bg-fondo px-5 py-3.5 text-sm font-semibold text-ambar-press">
                <span aria-hidden className="size-2 shrink-0 rounded-full bg-ambar" />
                Pieza única — si te interesa, apártala hoy
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <a
                href={urlWhatsApp(textoWhatsApp)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg bg-whatsapp px-4 py-3.5 font-display text-sm font-bold uppercase tracking-wide text-white transition-opacity duration-150 hover:opacity-90"
              >
                <IconWhatsApp lado={18} />
                Cotizar por WhatsApp
              </a>
              <p className="text-center text-xs text-tinta-suave">
                Respondemos en minutos en horario hábil.
              </p>

              <BotonCotizar
                mensaje={`Sobre la pieza usada ${nombre} (código ${pieza.codigo}), mi pregunta es: `}
                className="mt-1 w-full"
              >
                Preguntar por chat
              </BotonCotizar>
              <p className="text-center text-xs text-tinta-suave">
                El asistente cotiza 24/7.
              </p>

              <a
                href={`tel:${NEGOCIO.telefono}`}
                className="mt-1 flex items-center justify-center gap-2 rounded-lg border border-borde bg-superficie px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-tinta transition-colors duration-150 hover:border-grafito"
              >
                <Phone aria-hidden className="size-4" />
                Llamar {NEGOCIO.telefonoBonito}
              </a>
            </div>

            <div className="mt-6 hidden md:block">
              <QrWhatsApp texto={textoWhatsApp} />
            </div>
          </div>
        </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
        />
      </div>
    </>
  );
}
