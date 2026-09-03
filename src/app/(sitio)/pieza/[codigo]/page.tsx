import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { productoPorCodigo, relacionadosDeGolpe } from "@/lib/catalogo";
import { usadasEquivalentes } from "@/lib/usadas";
import { precioAldo, type PrecioAldo } from "@/lib/aldo";
import { rangoAnios } from "@/lib/formato";
import { slugificar } from "@/lib/slug";
import { PRELLENADOS, urlSitio } from "@/config/negocio";
import { FotoPieza } from "@/components/FotoPieza";
import { Migas, type Miga } from "@/components/Migas";
import { TituloSeccion } from "@/components/TituloSeccion";
import { QrWhatsApp } from "@/components/QrWhatsApp";
import { TarjetaProducto } from "@/components/TarjetaProducto";
import { TarjetaUsada } from "@/components/TarjetaUsada";
import { BloquePrecio } from "@/components/pieza/BloquePrecio";
import { Compatibilidades } from "@/components/pieza/Compatibilidades";
import { CopiarCodigo } from "@/components/pieza/CopiarCodigo";
import { CtasPieza } from "@/components/pieza/CtasPieza";

// Ficha de pieza NUEVA (/pieza/[codigo]). La base local manda; los datos
// secundarios (Bodega Usado, surtido sobre pedido) se consultan en paralelo y
// protegidos: si fallan, la ficha degrada sin romperse.

// La existencia y el precio cambian durante el día: se regenera cada 5 min.
export const revalidate = 300;

/** La consulta externa de sobre pedido jamás detiene la ficha más de 4 s. */
const TIMEOUT_SOBRE_PEDIDO_MS = 4000;

interface Props {
  params: Promise<{ codigo: string }>;
}

/** El código llega URL-encoded y puede venir malformado: nunca tirar la página. */
function decodificarCodigo(bruto: string): string {
  try {
    return decodeURIComponent(bruto);
  } catch {
    return bruto;
  }
}

/** Misma consulta para generateMetadata y la página (una sola ida a la base). */
const productoDe = cache(productoPorCodigo);

/** Disponibilidad sobre pedido con tope de espera: gana el primero entre la
 *  consulta externa y el temporizador; cualquier error cuenta como no
 *  encontrado. */
async function consultarSobrePedido(codigo: string): Promise<PrecioAldo> {
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<PrecioAldo>((resolver) => {
    temporizador = setTimeout(
      () => resolver({ encontrado: false }),
      TIMEOUT_SOBRE_PEDIDO_MS
    );
  });
  try {
    return await Promise.race([
      precioAldo(codigo).catch((): PrecioAldo => ({ encontrado: false })),
      limite,
    ]);
  } finally {
    clearTimeout(temporizador);
  }
}

// Sinónimos regionales para el SEO de la descripción (facia/defensa,
// calavera/stop, cofre/capó, salpicadera/aleta).
const SINONIMOS: Array<[RegExp, string]> = [
  [/\bFACIAS?\b/i, "defensa"],
  [/\bDEFENSAS?\b/i, "facia"],
  [/\bCALAVERAS?\b/i, "stop"],
  [/\bSTOPS?\b/i, "calavera"],
  [/\bCOFRES?\b/i, "capó"],
  [/\bCAP[OÓ]/i, "cofre"],
  [/\bSALPICADERAS?\b/i, "aleta"],
  [/\bALETAS?\b/i, "salpicadera"],
];

function sinonimoDe(texto: string): string | null {
  for (const [patron, sinonimo] of SINONIMOS) {
    if (patron.test(texto)) return sinonimo;
  }
  return null;
}

/** JSON-LD seguro para incrustar (escapa "<" para no cerrar el script). */
function jsonLd(datos: object): string {
  return JSON.stringify(datos).replace(/</g, "\\u003c");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { codigo } = await params;
  const producto = await productoDe(decodificarCodigo(codigo));
  if (!producto) return { title: "Pieza no encontrada" };

  const anios = rangoAnios(producto.aini, producto.afin);
  const titulo = `${[producto.descripcion, anios]
    .filter(Boolean)
    .join(" ")} | Nueva con Precio e IVA | Autopartes Vidaurri Monterrey`;
  const sinonimo = sinonimoDe(`${producto.descripcion} ${producto.tipoParte}`);
  const descripcion = [
    `${producto.descripcion} nueva${
      producto.marca ? ` para ${producto.marca}` : ""
    }${anios ? ` ${anios}` : ""}, con precio e IVA incluido.`,
    sinonimo ? `También se le dice ${sinonimo}.` : "",
    "Recógela hoy en Monterrey o cotiza por WhatsApp.",
  ]
    .filter(Boolean)
    .join(" ");
  const urlFoto = `${urlSitio()}/api/foto?codigo=${encodeURIComponent(
    producto.foto
  )}`;

  return {
    title: { absolute: titulo },
    description: descripcion,
    alternates: { canonical: `/pieza/${encodeURIComponent(producto.codigo)}` },
    openGraph: { title: titulo, description: descripcion, images: [urlFoto] },
  };
}

export default async function PaginaPieza({ params }: Props) {
  const { codigo } = await params;
  const producto = await productoDe(decodificarCodigo(codigo));
  if (!producto) notFound();

  // Datos secundarios en paralelo, cada uno protegido: la Bodega Usado y la
  // consulta de sobre pedido pueden fallar sin tirar la ficha. El sobre pedido
  // solo se consulta cuando NO hay existencia local.
  const [usadas, relacionados, senalSobrePedido] = await Promise.all([
    usadasEquivalentes(producto).catch(() => []),
    relacionadosDeGolpe(producto).catch(() => []),
    producto.enExistencia
      ? Promise.resolve<PrecioAldo>({ encontrado: false })
      : consultarSobrePedido(producto.codigo),
  ]);
  const sobrePedido = !producto.enExistencia && senalSobrePedido.encontrado;

  const anios = rangoAnios(producto.aini, producto.afin);
  const nombre = `${producto.descripcion}${anios ? ` ${anios}` : ""}`;
  const marcaSlug = producto.marca ? slugificar(producto.marca) : "";
  const tipoSlug = producto.tipoParte ? slugificar(producto.tipoParte) : "";

  const base = urlSitio();
  const urlPagina = `${base}/pieza/${encodeURIComponent(producto.codigo)}`;
  const fotoSrc = `/api/foto?codigo=${encodeURIComponent(producto.foto)}`;
  const urlFoto = `${base}${fotoSrc}`;

  const migas = [
    { nombre: "Inicio", url: `${base}/` },
    { nombre: "Refacciones", url: `${base}/refacciones` },
    ...(producto.marca
      ? [{ nombre: producto.marca, url: `${base}/refacciones/${marcaSlug}` }]
      : []),
    { nombre: producto.descripcion, url: urlPagina },
  ];

  const datosMigas = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: migas.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: m.nombre,
      item: m.url,
    })),
  };

  const datosProducto = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: nombre,
    sku: producto.codigo,
    image: urlFoto,
    ...(producto.marca
      ? { brand: { "@type": "Brand", name: producto.marca } }
      : {}),
    ...(producto.precioConIva > 0
      ? {
          offers: {
            "@type": "Offer",
            url: urlPagina,
            price: producto.precioConIva.toFixed(2),
            priceCurrency: "MXN",
            availability: producto.enExistencia
              ? "https://schema.org/InStock"
              : "https://schema.org/PreOrder",
            itemCondition: "https://schema.org/NewCondition",
          },
        }
      : {}),
  };

  const migasVisibles: Miga[] = [
    { nombre: "Inicio", href: "/" },
    { nombre: "Refacciones", href: "/refacciones" },
    ...(producto.marca
      ? [{ nombre: producto.marca, href: `/refacciones/${marcaSlug}` }]
      : []),
    { nombre: producto.descripcion },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(datosMigas) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(datosProducto) }}
      />

      <div className="border-b border-linea bg-hoja">
        <Migas items={migasVisibles} className="bajo-header mx-auto max-w-6xl px-4 pb-3.5" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        {/* Dos columnas y no tres: la tercera (el QR suelto) moría a un tercio
            de la página y dejaba medio metro de blanco al lado del precio. El
            ancho se lo queda ahora el contenido —la cifra, la tabla de
            aplicaciones y los códigos— y el QR baja a acompañar a las
            acciones, que es donde se escanea. */}
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-10 xl:gap-12">
          {/* La pieza sobre la mesa de dibujo, con su sello de lámina nueva. */}
          <div className="lamina relative self-start overflow-hidden lg:sticky lg:top-28">
            <FotoPieza
              src={fotoSrc}
              alt={`${producto.descripcion} — pieza nueva`}
              className="mesa-dibujo aspect-square w-full"
              imgClassName="p-6"
            />
            <span className="rotulo-tecnico absolute left-3 top-3 rounded-sm bg-plano px-2.5 py-1 text-[11px] leading-none text-white">
              Nueva
            </span>
          </div>

          {/* Columna de información y compra */}
          <div className="flex min-w-0 flex-col gap-6">
            <div>
              {/* Las descripciones del catálogo van de "COFRE" a una ristra de
                  150 caracteres con todas las aplicaciones. Con un solo tamaño,
                  las largas se comen la pantalla: el cuerpo baja según el largo. */}
              <h1
                className={
                  producto.descripcion.length > 70
                    ? "titulo-lamina text-[clamp(1.35rem,2.6vw,1.8rem)] leading-[1.08]"
                    : "titulo-lamina text-[clamp(1.9rem,4.5vw,2.75rem)]"
                }
              >
                {producto.descripcion}
              </h1>

              {/* El número de parte manda: así se pide la pieza en el mostrador. */}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-tinta-suave">
                <CopiarCodigo codigo={producto.codigo} />
                {producto.marca && (
                  <Link
                    href={`/refacciones/${marcaSlug}`}
                    className="rotulo-tecnico text-[13px] text-tinta underline-offset-4 hover:underline"
                  >
                    {producto.marca}
                  </Link>
                )}
                {producto.tipoParte &&
                  (marcaSlug ? (
                    <Link
                      href={`/refacciones/${marcaSlug}/${tipoSlug}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {producto.tipoParte}
                    </Link>
                  ) : (
                    <span>{producto.tipoParte}</span>
                  ))}
                {anios && (
                  <span className="num-tab rounded-sm border border-linea bg-papel px-2 py-1 font-mono text-xs leading-none">
                    {anios}
                  </span>
                )}
              </div>
            </div>

            <BloquePrecio
              precioConIva={producto.precioConIva}
              enExistencia={producto.enExistencia}
              sobrePedido={sobrePedido}
              usadas={usadas}
            />

            {/* El QR entra en el mismo renglón que las acciones a partir de
                xl. En móvil no se pinta: nadie escanea con su propio
                teléfono, ahí manda el botón wa.me. */}
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
              <CtasPieza
                nombre={nombre}
                codigo={producto.codigo}
                className="min-w-0 flex-1"
              />
              <QrWhatsApp
                texto={PRELLENADOS.pieza(nombre, producto.codigo)}
                leyenda="Escanéalo y cotiza esta pieza por WhatsApp"
                className="hidden shrink-0 xl:block"
              />
            </div>

            <Compatibilidades
              marca={producto.marca}
              aplicaciones={producto.aplicaciones}
            />

            {producto.codigosAlternos.length > 0 && (
              <section aria-labelledby="codigos-alternos">
                <h2
                  id="codigos-alternos"
                  className="rotulo-tecnico text-[13px] text-tinta-suave"
                >
                  Códigos alternos
                </h2>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {producto.codigosAlternos.map((c, i) => (
                    <li
                      key={`${c}-${i}`}
                      className="num-tab rounded-sm border border-linea bg-hoja px-2.5 py-1 font-mono text-xs text-tinta-suave"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>

        {usadas.length > 0 && (
          <section id="usadas" className="mt-20 scroll-mt-28">
            <TituloSeccion
              titulo="La misma pieza, usada y más barata"
              descripcion="Cada una es única y la foto es de la pieza exacta que recibes, no de catálogo."
            />
            <div className="mt-8 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
              {usadas.map((u, i) => (
                <TarjetaUsada key={u.id} p={u} indice={i} />
              ))}
            </div>
          </section>
        )}

        {/* La zona del golpe: las partidas vecinas del despiece, numeradas y
            con su línea guía, igual que en la lámina del manual. */}
        {relacionados.length > 0 && (
          <section className="mt-20">
            <TituloSeccion
              titulo="Se choca junto con"
              descripcion="Un golpe casi nunca daña una sola pieza. Estas son las partidas que suelen cambiarse en la misma zona."
            />
            <ol className="mt-8 grid grid-cols-2 gap-x-3 gap-y-6 md:gap-x-4 lg:grid-cols-4">
              {relacionados.map((r, i) => (
                <li
                  key={r.codigo}
                  className="flex min-w-0 flex-col gap-2 [&>article]:flex-1"
                >
                  <span aria-hidden className="flex items-center gap-1.5">
                    <span className="globo-partida shrink-0">{i + 1}</span>
                    <span className="h-px flex-1 bg-linea-fuerte" />
                  </span>
                  <TarjetaProducto p={r} />
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </>
  );
}
