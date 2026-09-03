import type { Metadata } from "next";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import clsx from "clsx";
import { Paginacion } from "@/components/catalogo/Paginacion";
import { pesos } from "@/lib/formato";
import { listarPedidos, type PaginaPedidosMostrador } from "@/lib/mostrador/datos";
import { ETIQUETA_CANAL, ETIQUETA_SUCURSAL, fechaHora, telefonoLegible } from "@/lib/mostrador/etiquetas";
import {
  conEstatus,
  filtrosDeQuery,
  hayFiltros,
  queryDeFiltros,
  sinPagina,
  urlCola,
  type FiltrosCola,
} from "@/lib/mostrador/filtros";
import { CLASE_SELLO_ESTATUS, ETIQUETA_ESTATUS, ORDEN_ESTATUS } from "@/lib/mostrador/reglas";
import type { EstatusPedido, PedidoResumen } from "@/lib/mostrador/tipos";
import { RUTA_MOSTRADOR } from "@/lib/mostrador/volver";
import { FiltrosPedidos } from "./FiltrosPedidos";

// Cola de pedidos del mostrador. Página de servidor: lee los filtros del
// querystring, pide la página a IA (SSR directo, sin pasar por los proxies) y
// pinta la tabla densa. Arriba, el conteo por estatus como fichas que también
// filtran, y el único botón ámbar de la pantalla: "Nuevo pedido".

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

const CLASE_TH =
  "whitespace-nowrap px-3 py-2.5 text-left font-display text-[11px] font-bold uppercase tracking-[0.12em] text-tinta-suave";
const CLASE_TD = "px-3 py-2.5 align-middle";

function FichasEstatus({
  porEstatus,
  filtros,
}: {
  porEstatus: Record<EstatusPedido, number>;
  filtros: FiltrosCola;
}) {
  const base = sinPagina(filtros);
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="Pedidos por estatus">
      {ORDEN_ESTATUS.map((estatus) => {
        const activa = filtros.estatus === estatus;
        return (
          <li key={estatus}>
            <Link
              href={urlCola(conEstatus(base, activa ? undefined : estatus))}
              aria-current={activa ? "true" : undefined}
              className={clsx(
                "lamina lamina-enlace flex flex-col gap-1 px-3 py-2.5",
                activa && "border-tinta"
              )}
            >
              <span className="rotulo-tecnico text-[11px] text-tinta-suave">{ETIQUETA_ESTATUS[estatus]}</span>
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

function FilaPedido({ pedido }: { pedido: PedidoResumen }) {
  const detalle = `${RUTA_MOSTRADOR}/pedidos/${pedido.id}`;
  return (
    <tr className="border-t border-linea transition-colors duration-150 hover:bg-papel">
      <td className={CLASE_TD}>
        <Link href={detalle} className="num-tab font-mono text-sm font-semibold text-tinta underline-offset-4 hover:underline">
          {pedido.folio ?? `#${pedido.id}`}
        </Link>
      </td>
      <td className={clsx(CLASE_TD, "num-tab whitespace-nowrap text-sm text-tinta-suave")}>
        {fechaHora(pedido.creadoEn) || "—"}
      </td>
      <td className={clsx(CLASE_TD, "max-w-56 truncate text-sm font-medium")} title={pedido.cliente}>
        {pedido.cliente}
      </td>
      <td className={clsx(CLASE_TD, "num-tab whitespace-nowrap font-mono text-sm text-tinta-suave")}>
        {telefonoLegible(pedido.telefono) || "—"}
      </td>
      <td className={clsx(CLASE_TD, "whitespace-nowrap text-sm")}>{ETIQUETA_SUCURSAL[pedido.sucursal]}</td>
      <td className={CLASE_TD}>
        <span className="rotulo-tecnico inline-flex rounded-full bg-papel-hondo px-2 py-0.5 text-[10px] text-tinta-suave">
          {ETIQUETA_CANAL[pedido.canal]}
        </span>
      </td>
      <td className={clsx(CLASE_TD, "font-mono text-sm text-tinta-suave")}>{pedido.capturadoPor ?? "cliente"}</td>
      <td className={clsx(CLASE_TD, "num-tab text-right font-mono text-sm")}>{pedido.numPartidas}</td>
      <td className={clsx(CLASE_TD, "num-tab whitespace-nowrap text-right font-mono text-sm font-semibold")}>
        {pesos(pedido.total)}
      </td>
      <td className={CLASE_TD}>
        <span className={CLASE_SELLO_ESTATUS[pedido.estatus]}>{ETIQUETA_ESTATUS[pedido.estatus]}</span>
      </td>
    </tr>
  );
}

function TablaPedidos({ pedidos }: { pedidos: PedidoResumen[] }) {
  return (
    <div className="lamina overflow-x-auto">
      <table className="w-full min-w-[960px] border-collapse text-tinta">
        <thead className="bg-papel">
          <tr>
            <th scope="col" className={CLASE_TH}>Folio</th>
            <th scope="col" className={CLASE_TH}>Fecha</th>
            <th scope="col" className={CLASE_TH}>Cliente</th>
            <th scope="col" className={CLASE_TH}>Teléfono</th>
            <th scope="col" className={CLASE_TH}>Sucursal</th>
            <th scope="col" className={CLASE_TH}>Canal</th>
            <th scope="col" className={CLASE_TH}>Capturó</th>
            <th scope="col" className={clsx(CLASE_TH, "text-right")}>Partidas</th>
            <th scope="col" className={clsx(CLASE_TH, "text-right")}>Total (IVA incluido)</th>
            <th scope="col" className={CLASE_TH}>Estatus</th>
          </tr>
        </thead>
        <tbody>
          {pedidos.map((pedido) => (
            <FilaPedido key={pedido.id} pedido={pedido} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function PaginaCola({
  searchParams,
}: {
  searchParams: Promise<ParametrosBusqueda>;
}) {
  const filtros = filtrosDeQuery(await searchParams);
  const { pagina, error } = await cargarCola(filtros);
  const filtrosBase = sinPagina(filtros);
  const totalPaginas = pagina ? Math.max(1, Math.ceil(pagina.total / pagina.porPagina)) : 1;

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

      {pagina && <FichasEstatus porEstatus={pagina.porEstatus} filtros={filtros} />}

      {/* Clave derivada de la URL (patrón del catálogo): la isla guarda la
          selección en useState, y sin remontarla React conserva la instancia
          tras router.push, así que fichas de estatus y paginación cambiarían
          la tabla pero no el formulario. */}
      <FiltrosPedidos key={urlCola(filtrosBase)} iniciales={filtrosBase} />

      {error && (
        <div role="alert" className="lamina border-anotacion px-5 py-4">
          <p className="rotulo-tecnico text-xs text-anotacion">No se pudo leer la cola</p>
          <p className="mt-1 text-sm text-tinta">{error}</p>
          <Link href={urlCola(filtrosBase, filtros.pagina)} className="mt-2 inline-block text-sm font-semibold underline underline-offset-4">
            Volver a intentar
          </Link>
        </div>
      )}

      {pagina && pagina.pedidos.length === 0 && (
        <div className="lamina px-5 py-10 text-center">
          <p className="titulo-lamina text-2xl">Sin pedidos con esos filtros</p>
          <p className="mt-2 text-sm text-tinta-suave">
            {hayFiltros(filtros)
              ? "Afloja los filtros o revisa el rango de fechas."
              : "Cuando un cliente o un vendedor envíe un pedido, aparece aquí."}
          </p>
          {hayFiltros(filtros) && (
            <Link href={RUTA_MOSTRADOR} className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">
              Ver todos los pedidos
            </Link>
          )}
        </div>
      )}

      {pagina && pagina.pedidos.length > 0 && (
        <>
          <p className="num-tab text-sm text-tinta-suave">
            <span className="font-mono font-semibold text-tinta">{pagina.total}</span>{" "}
            {pagina.total === 1 ? "pedido" : "pedidos"}
            {totalPaginas > 1 && (
              <>
                {" · página "}
                <span className="font-mono">{filtros.pagina}</span> de <span className="font-mono">{totalPaginas}</span>
              </>
            )}
          </p>
          <TablaPedidos pedidos={pagina.pedidos} />
          <Paginacion
            pagina={filtros.pagina}
            totalPaginas={totalPaginas}
            rutaBase={RUTA_MOSTRADOR}
            query={queryDeFiltros(filtrosBase)}
          />
        </>
      )}
    </div>
  );
}
