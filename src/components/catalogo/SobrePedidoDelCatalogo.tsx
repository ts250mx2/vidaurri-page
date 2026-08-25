import { candidatosSobrePedido, type FiltrosCatalogo, type ProductoResumen } from "@/lib/catalogo";
import { precioAldo } from "@/lib/aldo";
import { urlFotoNueva } from "@/lib/fotos";
import { rangoAnios } from "@/lib/formato";
import { PRELLENADOS, urlWhatsApp } from "@/config/negocio";
import { TituloSeccion } from "@/components/TituloSeccion";
import { FotoPieza } from "@/components/FotoPieza";
import { BotonCotizar } from "@/components/BotonCotizar";
import { IconWhatsApp } from "@/components/IconWhatsApp";

// Franja de piezas taiwanesas SOBRE PEDIDO dentro de la búsqueda del catálogo:
// artículos que cruzan con los mismos filtros pero que hoy no están en el
// mostrador de Vidaurri, verificados uno a uno contra el catálogo en línea del
// proveedor (Aldo, scraping cacheado con semáforo). Solo se ofrece lo que el
// proveedor SÍ tiene: "te la conseguimos" con bodega vacía es urgencia
// inventada, y eso está prohibido.
//
// Sin precio a la vista a propósito: el precio de lista del proveedor no es el
// precio de Vidaurri, y publicar una cifra que el mostrador no va a respetar
// quema la venta. La cifra la da la cotización (chat o WhatsApp).
//
// El proveedor es remoto y lento: esta franja SIEMPRE va en <Suspense> y
// cualquier falla loguea y desaparece sin tocar el resto de la página.

const MAX_CANDIDATOS = 8;
const MAX_TARJETAS = 4;

function hayEnProveedor(existencia: number | string | undefined): boolean {
  if (typeof existencia === "string") return true; // "Mas de 60"
  return (existencia ?? 0) > 0;
}

export async function SobrePedidoDelCatalogo({
  filtros,
}: {
  filtros: FiltrosCatalogo;
}) {
  const hayBusqueda = Boolean(
    filtros.texto || filtros.idLinea || filtros.idModelo || filtros.idParte || filtros.anio
  );
  if (!hayBusqueda) return null;

  let candidatos: ProductoResumen[];
  try {
    candidatos = await candidatosSobrePedido(filtros, MAX_CANDIDATOS);
  } catch (error) {
    console.error("No se pudieron buscar candidatos sobre pedido:", error);
    return null;
  }
  if (candidatos.length === 0) return null;

  // Verificación contra el proveedor: precioAldo cachea 30 min por código y no
  // lanza (falla de red = no encontrado), así que el Promise.all es seguro.
  const verificados = await Promise.all(
    candidatos.map(async (p) => {
      const aldo = await precioAldo(p.codigo);
      return aldo.encontrado && hayEnProveedor(aldo.existencia) ? p : null;
    })
  );
  const disponibles = verificados
    .filter((p): p is ProductoResumen => p !== null)
    .slice(0, MAX_TARJETAS);
  if (disponibles.length === 0) return null;

  return (
    <section aria-labelledby="sobre-pedido-titulo" className="mt-10 md:mt-12">
      <TituloSeccion
        titulo={
          <span id="sobre-pedido-titulo">Te las conseguimos sobre pedido</span>
        }
        descripcion="Piezas taiwanesas de importación que hoy no están en el mostrador, pero nuestro proveedor sí las tiene: pídelas y te confirmamos precio y tiempo de entrega."
      />

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
        {disponibles.map((p) => {
          const anios = rangoAnios(p.aini, p.afin);
          const nombre = [p.descripcion, p.marca].filter(Boolean).join(" ");
          return (
            <article key={p.codigo} className="lamina flex flex-col overflow-hidden">
              <div className="relative border-b border-linea bg-papel-hondo">
                <FotoPieza
                  src={urlFotoNueva(p.foto)}
                  alt={`${p.descripcion} — pieza de importación sobre pedido`}
                  className="aspect-[4/3] w-full"
                  imgClassName="object-contain p-3"
                />
                <span className="rotulo-tecnico absolute left-2.5 top-2.5 rounded-sm bg-plano-hondo/85 px-2 py-1 text-[10.5px] leading-none text-white">
                  Sobre pedido
                </span>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <p className="num-tab truncate font-mono text-[13px] font-semibold leading-none tracking-tight text-tinta">
                  {p.codigo}
                </p>
                <h3 className="mt-2 line-clamp-2 text-[13.5px] font-semibold leading-snug text-tinta">
                  {p.descripcion}
                </h3>
                {(p.marca || anios) && (
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-tinta-suave">
                    {p.marca && (
                      <span className="rotulo-tecnico leading-none">{p.marca}</span>
                    )}
                    {anios && (
                      <span className="num-tab font-mono leading-none">{anios}</span>
                    )}
                  </p>
                )}

                <div className="mt-auto flex gap-2 pt-3.5">
                  <BotonCotizar
                    mensaje={PRELLENADOS.sobrePedido(nombre, p.codigo)}
                    className="min-w-0 flex-1"
                  >
                    Cotízala
                  </BotonCotizar>
                  <a
                    href={urlWhatsApp(PRELLENADOS.sobrePedido(nombre, p.codigo))}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Cotizar ${p.descripcion} sobre pedido por WhatsApp`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-whatsapp text-plano-hondo transition-[filter] duration-150 hover:brightness-95 active:brightness-90"
                  >
                    <IconWhatsApp lado={18} />
                  </a>
                </div>
                <p className="mt-2 text-[11px] leading-snug text-tinta-suave">
                  Te confirmamos precio y tiempo de entrega. El asistente cotiza 24/7.
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
