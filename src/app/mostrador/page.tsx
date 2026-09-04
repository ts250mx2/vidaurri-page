import type { Metadata } from "next";
import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";
import { PackageOpen } from "lucide-react";
import clsx from "clsx";
import { TONO_ESTATUS } from "@/components/mostrador/Etiquetas";
import { listarPedidos, type PaginaPedidosMostrador } from "@/lib/mostrador/datos";
import { ETIQUETA_CANAL, ETIQUETA_SUCURSAL, rangoFechasLegible } from "@/lib/mostrador/etiquetas";
import {
  conEstatus,
  conFechasPorDefecto,
  filtrosDeQuery,
  hayFiltros,
  rangoMesEnCurso,
  sinPagina,
  urlCola,
  urlSinFiltros,
  type FiltrosBase,
  type FiltrosCola,
} from "@/lib/mostrador/filtros";
import { ETIQUETA_ESTATUS, ORDEN_ESTATUS } from "@/lib/mostrador/reglas";
import { sesionMostrador } from "@/lib/mostrador/sesion";
import type { EstatusPedido } from "@/lib/mostrador/tipos";
import { RUTA_LOGIN_MOSTRADOR, RUTA_MOSTRADOR } from "@/lib/mostrador/volver";
import { BusquedaRapida } from "./BusquedaRapida";
import { FiltrosPedidos } from "./FiltrosPedidos";
import { PanelFiltros } from "./PanelFiltros";
import { PieTabla } from "./PieTabla";
import { TablaPedidos } from "./TablaPedidos";

// Cola de pedidos del mostrador. Página de servidor: lee los filtros del
// querystring, pide la página a IA (SSR directo, sin pasar por los proxies) y
// pinta la tabla (`TablaPedidos`, a una pantalla sin scroll horizontal) con
// su pie: cuántos se ven, paginación y tamaño de página. De los filtros solo
// está siempre a la vista la búsqueda rápida; el conteo por estatus (fichas de
// color que también filtran) y los selects viven dentro del panel plegable,
// cuyo resumen dice qué está filtrando. El único botón ámbar de la pantalla
// es "Nuevo pedido". Sin fechas en la URL se enseña el mes en curso (horario
// de Monterrey), salvo cuando hay búsqueda. Los colores de estatus y canal
// salen de `components/mostrador/Etiquetas`, los mismos del detalle.

export const metadata: Metadata = {
  title: "Pedidos · Mostrador",
};

type ParametrosBusqueda = Record<string, string | string[] | undefined>;

interface CargaCola {
  pagina: PaginaPedidosMostrador | null;
  /** Mensaje legible cuando IA no respondió; la cola se pinta con aviso en vez de romperse. */
  error: string | null;
}

async function cargarCola(filtros: FiltrosCola): Promise<CargaCola> {
  try {
    return { pagina: await listarPedidos(filtros), error: null };
  } catch (error) {
    // redirect() a login viaja como excepción de Next: hay que dejarla pasar.
    unstable_rethrow(error);
    console.error("[mostrador] fallo listando la cola", error);
    return { pagina: null, error: error instanceof Error ? error.message : "No fue posible leer la cola" };
  }
}

const CLASE_CHIP =
  "rotulo-tecnico inline-flex max-w-full items-center truncate rounded-full border border-linea bg-papel px-2 py-0.5 text-[10px] text-tinta";

// Ficha compuesta a mano y no con `.lamina`: esa clase pone el borde entero
// (fuera de las capas de Tailwind) y taparía el `border-tinta` de la activa.
// La barra de color es un hijo absoluto para que sobreviva al cambio de borde
// en hover y activa.
const CLASE_FICHA =
  "relative flex flex-col gap-1 overflow-hidden rounded-[0.625rem] border border-linea bg-hoja py-2.5 pr-3 pl-4 shadow-lamina transition-[border-color,box-shadow,transform] duration-150 hover:border-tinta hover:shadow-lamina-alta motion-safe:hover:-translate-y-0.5";

/**
 * Conteo por estatus como fichas de color que también filtran (la activa se
 * apaga al volver a tocarla). Viven dentro del panel de filtros, arriba de los
 * selects: son la vista rápida de la cola, no un tablero aparte.
 */
function FichasEstatus({ porEstatus, base }: { porEstatus: Record<EstatusPedido, number>; base: FiltrosBase }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" aria-label="Pedidos por estatus">
      {ORDEN_ESTATUS.map((estatus) => {
        const activa = base.estatus === estatus;
        const tono = TONO_ESTATUS[estatus];
        return (
          <li key={estatus}>
            <Link
              href={urlCola(conEstatus(base, activa ? undefined : estatus))}
              aria-current={activa ? "true" : undefined}
              className={clsx(CLASE_FICHA, activa && clsx("border-tinta shadow-lamina-alta", tono.fondo))}
            >
              <span aria-hidden className={clsx("absolute inset-y-0 left-0 w-1", tono.punto)} />
              <span className="rotulo-tecnico truncate text-[11px] text-tinta-suave">{ETIQUETA_ESTATUS[estatus]}</span>
              <span className="num-tab font-display text-2xl font-extrabold leading-none text-tinta">
                {porEstatus[estatus] ?? 0}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Chips de lo que está filtrando (con el rango de fechas, sea de la URL o el
 * del mes por defecto) y "Limpiar" cuando la URL trae algo. Va dentro del
 * <summary>: un clic en el enlace navega sin abrir el panel, porque el
 * navegador activa el <a> y no el resumen. "Limpiar" conserva el tamaño de
 * página: no es un filtro.
 */
function ResumenFiltros({ filtros, filtrosUrl }: { filtros: FiltrosCola; filtrosUrl: FiltrosCola }) {
  const chips: string[] = [];
  if (filtros.estatus) chips.push(ETIQUETA_ESTATUS[filtros.estatus]);
  if (filtros.sucursal) chips.push(ETIQUETA_SUCURSAL[filtros.sucursal]);
  if (filtros.canal) chips.push(ETIQUETA_CANAL[filtros.canal]);
  if (filtros.usuario) chips.push(`Vendedor: ${filtros.usuario}`);
  if (filtros.busqueda) chips.push(`“${filtros.busqueda}”`);
  const rango = rangoFechasLegible(filtros.desde, filtros.hasta);
  if (rango) chips.push(rango);
  return (
    <>
      {chips.map((chip) => (
        <span key={chip} className={CLASE_CHIP} title={chip}>
          {chip}
        </span>
      ))}
      {hayFiltros(filtrosUrl) && (
        <Link
          href={urlSinFiltros(filtrosUrl)}
          className="ml-1 text-[13px] font-semibold text-tinta-suave underline-offset-4 transition-colors duration-150 hover:text-tinta hover:underline"
        >
          Limpiar
        </Link>
      )}
    </>
  );
}

export default async function PaginaCola({
  searchParams,
}: {
  searchParams: Promise<ParametrosBusqueda>;
}) {
  // `filtrosUrl` es lo que pidió el vendedor (manda en enlaces y en "Limpiar");
  // `filtros` es lo que se le pide a IA, con el mes en curso si la URL no
  // trae fechas ni búsqueda. Los enlaces se arman con la URL para que el rango
  // por defecto siga siendo implícito y no se "pegue" como filtro explícito.
  const filtrosUrl = filtrosDeQuery(await searchParams);
  const filtros = conFechasPorDefecto(filtrosUrl, rangoMesEnCurso(new Date()));
  const [sesion, { pagina, error }] = await Promise.all([sesionMostrador(), cargarCola(filtros)]);
  if (!sesion) redirect(RUTA_LOGIN_MOSTRADOR);

  const filtrosBase = sinPagina(filtrosUrl);
  // Clave derivada de la URL (patrón del catálogo): las islas guardan lo
  // escrito en useState y, sin remontarlas, React conserva la instancia tras
  // router.push; así una ficha, un chip o "Limpiar" cambiarían la tabla pero
  // no lo que enseñan el campo de búsqueda y el formulario.
  const claveUrl = urlCola(filtrosBase);
  const rango = rangoFechasLegible(filtros.desde, filtros.hasta);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="rotulo-tecnico text-xs text-tinta-suave">Mostrador</p>
          <h1 className="titulo-lamina mt-1 text-3xl sm:text-4xl">Pedidos</h1>
        </div>
        <Link
          href={`${RUTA_MOSTRADOR}/nuevo`}
          className="rotulo-tecnico inline-flex h-12 items-center rounded-md bg-ambar px-5 text-sm text-plano-hondo transition-colors duration-150 hover:bg-ambar-press active:bg-ambar-press"
        >
          Nuevo pedido
        </Link>
      </div>

      <BusquedaRapida key={claveUrl} base={filtrosBase} />

      {/* El formulario arranca con las fechas efectivas (las del mes si la URL
          no trae) para que se vean y se puedan mover. */}
      <PanelFiltros resumen={<ResumenFiltros filtros={filtros} filtrosUrl={filtrosUrl} />}>
        {pagina && <FichasEstatus porEstatus={pagina.porEstatus} base={filtrosBase} />}
        <FiltrosPedidos key={claveUrl} iniciales={sinPagina(filtros)} hayFiltrosUrl={hayFiltros(filtrosUrl)} />
      </PanelFiltros>

      {error && (
        <div role="alert" className="lamina border-anotacion px-5 py-4">
          <p className="rotulo-tecnico text-xs text-anotacion">No se pudo leer la cola</p>
          <p className="mt-1 text-sm text-tinta">{error}</p>
          <Link href={urlCola(filtrosBase, filtrosUrl.pagina)} className="mt-2 inline-block text-sm font-semibold underline underline-offset-4">
            Volver a intentar
          </Link>
        </div>
      )}

      {pagina && pagina.total > 0 && pagina.pedidos.length === 0 && (
        // Un enlace guardado a una página que ya no existe (la cola se
        // encogió): no es "sin resultados", y la salida conserva los filtros.
        <div className="lamina px-5 py-10 text-center">
          <PackageOpen aria-hidden className="mx-auto size-8 text-linea-fuerte" />
          <p className="titulo-lamina mt-3 text-2xl">Esa página ya no existe</p>
          <p className="mt-2 text-sm text-tinta-suave">La cola tiene menos páginas que antes.</p>
          <Link href={urlCola(filtrosBase, 1)} className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">
            Ir a la primera página
          </Link>
        </div>
      )}

      {pagina && pagina.total === 0 && (
        <div className="lamina px-5 py-10 text-center">
          <PackageOpen aria-hidden className="mx-auto size-8 text-linea-fuerte" />
          <p className="titulo-lamina mt-3 text-2xl">
            {hayFiltros(filtrosUrl) ? "Sin pedidos con esos filtros" : `Sin pedidos del ${rango}`}
          </p>
          <p className="mt-2 text-sm text-tinta-suave">
            {hayFiltros(filtrosUrl)
              ? "Afloja los filtros o revisa el rango de fechas."
              : "Abre los filtros y mueve la fecha “Desde” para ver pedidos anteriores."}
          </p>
          {hayFiltros(filtrosUrl) && (
            <Link href={urlSinFiltros(filtrosUrl)} className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">
              Quitar filtros
            </Link>
          )}
        </div>
      )}

      {pagina && pagina.pedidos.length > 0 && (
        <TablaPedidos
          pedidos={pagina.pedidos}
          perfil={sesion.perfil}
          pie={
            <PieTabla
              total={pagina.total}
              pagina={filtrosUrl.pagina}
              porPagina={pagina.porPagina}
              base={filtrosBase}
            />
          }
        />
      )}
    </div>
  );
}
