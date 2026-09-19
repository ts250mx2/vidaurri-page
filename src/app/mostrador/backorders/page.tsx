import type { Metadata } from "next";
import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";
import { ChevronLeft, ChevronRight, FileSpreadsheet, PackageOpen } from "lucide-react";
import { listarPedidos, type PaginaPedidosMostrador } from "@/lib/mostrador/datos";
import { rangoFechasLegible } from "@/lib/mostrador/etiquetas";
import { conFechasPorDefecto, fechaMonterrey, filtrosDeQuery, rangoMesEnCurso } from "@/lib/mostrador/filtros";
import { tieneBackorder } from "@/lib/mostrador/reglas";
import { sesionMostrador } from "@/lib/mostrador/sesion";
import type { PedidoResumen } from "@/lib/mostrador/tipos";
import { RUTA_LOGIN_MOSTRADOR, RUTA_MOSTRADOR } from "@/lib/mostrador/volver";
import { TablaBackorders } from "./TablaBackorders";

// Lo que la casa le tiene pedido a Aldo Autopartes: los pedidos con back
// order, que IA arma sola al confirmar un pedido con piezas que no hay en
// tienda. Es la cola de pedidos filtrada (`backorder=si`), no otra base: la
// misma lámina, la misma cabecera grafito y el mismo rango por defecto —el
// mes en curso, en horario de Monterrey—, pero sin los filtros de la cola,
// que aquí no tienen qué acotar. Lo único que se mueve es el mes, con las dos
// flechas del encabezado, para que la pantalla no sea un callejón cuando el
// mes empieza vacío. Sin ámbar: aquí no hay nada que convertir.

export const metadata: Metadata = {
  title: "Back orders · Mostrador",
};

type ParametrosBusqueda = Record<string, string | string[] | undefined>;

const RUTA_BACKORDERS = `${RUTA_MOSTRADOR}/backorders`;
/**
 * Las back orders de un mes son decenas, no miles: se piden todas de un golpe
 * (IA acota "todos" a su tope, 1000) y así la pantalla no carga con una
 * paginación que nadie usaría. Si algún mes tocara el tope, el pie lo dice.
 */
const POR_PAGINA = "todos" as const;

interface Rango {
  desde: string;
  hasta: string;
}

interface CargaLista {
  pagina: PaginaPedidosMostrador | null;
  /** Mensaje legible cuando IA no respondió; la lista se pinta con aviso en vez de romperse. */
  error: string | null;
}

async function cargarLista(rango: Partial<Rango>): Promise<CargaLista> {
  try {
    return { pagina: await listarPedidos({ ...rango, backorder: "si", porPagina: POR_PAGINA }), error: null };
  } catch (error) {
    // redirect() a login viaja como excepción de Next: hay que dejarla pasar.
    unstable_rethrow(error);
    console.error("[mostrador] fallo listando las back orders", error);
    return {
      pagina: null,
      error: error instanceof Error ? error.message : "No fue posible leer las back orders",
    };
  }
}

/** 'AAAA-MM' de una fecha 'AAAA-MM-DD'; "" si no es una fecha reconocible. */
function mesDe(iso: string | undefined): string {
  return /^\d{4}-\d{2}/.test(iso ?? "") ? (iso as string).slice(0, 7) : "";
}

/**
 * Mes completo (del día 1 al último) al que pertenece `iso`, corrido `delta`
 * meses. El último día sale del "día 0" del mes siguiente, en UTC para que la
 * zona horaria no lo corra un día. null si `iso` no es una fecha.
 */
function rangoMesVecino(iso: string | undefined, delta: number): Rango | null {
  const m = /^(\d{4})-(\d{2})/.exec(iso ?? "");
  if (!m) return null;
  const meses = Number(m[1]) * 12 + (Number(m[2]) - 1) + delta;
  const anio = Math.floor(meses / 12);
  const mes = (meses % 12) + 1;
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const dos = (n: number) => String(n).padStart(2, "0");
  return { desde: `${anio}-${dos(mes)}-01`, hasta: `${anio}-${dos(mes)}-${dos(ultimo)}` };
}

function urlRango(rango: Rango): string {
  return `${RUTA_BACKORDERS}?desde=${rango.desde}&hasta=${rango.hasta}`;
}

/** El .xlsx del mismo rango que se está viendo (`exportar/route.ts`). */
function urlExcel(rango: Partial<Rango>): string {
  const qs = new URLSearchParams();
  if (rango.desde) qs.set("desde", rango.desde);
  if (rango.hasta) qs.set("hasta", rango.hasta);
  const texto = qs.toString();
  return `${RUTA_BACKORDERS}/exportar${texto ? `?${texto}` : ""}`;
}

const CLASE_EXPORTAR =
  "inline-flex h-10 items-center gap-2 rounded-md border border-linea bg-hoja px-3 text-sm font-semibold text-tinta transition-colors duration-150 hover:border-tinta hover:bg-plano hover:text-white";

const CLASE_FLECHA =
  "inline-flex size-10 items-center justify-center rounded-md border border-linea bg-hoja text-tinta transition-colors duration-150 hover:border-tinta hover:bg-plano hover:text-white";

/**
 * Las dos flechas para cambiar de mes, con el rango en medio. La de adelante
 * no se pinta cuando ya se está en el mes en curso: no hay back orders del
 * futuro y un enlace a un mes vacío es una promesa falsa.
 */
function NavegacionMes({ desde, hasta, hoy }: { desde?: string; hasta?: string; hoy: string }) {
  const anterior = rangoMesVecino(desde, -1);
  const siguiente = rangoMesVecino(desde, 1);
  const rango = rangoFechasLegible(desde, hasta);
  const hayFuturo = siguiente !== null && mesDe(desde) < mesDe(hoy);
  return (
    <div className="flex items-center gap-2">
      {anterior && (
        <Link href={urlRango(anterior)} aria-label="Mes anterior" title="Mes anterior" className={CLASE_FLECHA}>
          <ChevronLeft aria-hidden className="size-4" />
        </Link>
      )}
      {rango && <span className="num-tab min-w-32 text-center text-sm text-tinta-suave">{rango}</span>}
      {hayFuturo && (
        <Link
          href={urlRango(siguiente)}
          aria-label="Mes siguiente"
          title="Mes siguiente"
          className={CLASE_FLECHA}
        >
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      )}
    </div>
  );
}

function Vacio({ rango }: { rango: string }) {
  return (
    <div className="lamina px-5 py-10 text-center">
      <PackageOpen aria-hidden className="mx-auto size-8 text-linea-fuerte" />
      <p className="titulo-lamina mt-3 text-2xl">Todavía no hay back orders</p>
      <p className="mx-auto mt-2 max-w-prose text-sm text-tinta-suave">
        {rango ? <>Ninguna en {rango}. </> : null}
        Se arman solas al confirmar un pedido con piezas sin existencia: la pieza que no está en
        tienda se le pide a Aldo y aparece aquí con su número del POS.
      </p>
      <Link href={RUTA_MOSTRADOR} className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">
        Ir a la cola de pedidos
      </Link>
    </div>
  );
}

/**
 * Cuántas se están viendo. Cuando IA dice que hay más de las que mandó
 * (tope de "todos"), se dice en voz alta en vez de enseñar una cifra que no
 * cuadra con los renglones.
 */
function Pie({ visibles, total }: { visibles: number; total: number }) {
  const sustantivo = visibles === 1 ? "back order" : "back orders";
  return (
    <p className="num-tab border-t border-linea px-4 py-3 text-sm text-tinta-suave">
      <span className="font-mono font-semibold text-tinta">{visibles.toLocaleString("es-MX")}</span>{" "}
      {sustantivo}
      {total > visibles && (
        <> de {total.toLocaleString("es-MX")}: acota el mes para ver las que faltan.</>
      )}
    </p>
  );
}

export default async function PaginaBackorders({
  searchParams,
}: {
  searchParams: Promise<ParametrosBusqueda>;
}) {
  const ahora = new Date();
  const hoy = fechaMonterrey(ahora);
  // Del querystring solo interesan las fechas: esta pantalla no filtra por
  // estatus, canal ni vendedor. Sin fechas, el mes en curso, igual que la cola.
  const urlFiltros = filtrosDeQuery(await searchParams);
  const { desde, hasta } = conFechasPorDefecto(
    { desde: urlFiltros.desde, hasta: urlFiltros.hasta, pagina: 1, porPagina: POR_PAGINA },
    rangoMesEnCurso(ahora)
  );

  const [sesion, { pagina, error }] = await Promise.all([sesionMostrador(), cargarLista({ desde, hasta })]);
  if (!sesion) redirect(RUTA_LOGIN_MOSTRADOR);

  // Cinturón por si el motor todavía no entiende `backorder=si` y devolvió la
  // cola entera: se filtra aquí y se avisa en el log, porque una lista de back
  // orders llena de pedidos sin back order no se nota a simple vista.
  const recibidos: PedidoResumen[] = pagina?.pedidos ?? [];
  const pedidos = recibidos.filter(tieneBackorder);
  const filtroIgnorado = pedidos.length !== recibidos.length;
  if (filtroIgnorado) {
    console.warn(
      "[mostrador] IA devolvió pedidos sin back order: ¿llegó el filtro backorder=si?",
      recibidos.length,
      pedidos.length
    );
  }
  // Con el filtro ignorado, el total de IA cuenta también los que se quitaron.
  const total = filtroIgnorado ? pedidos.length : (pagina?.total ?? 0);
  const rango = rangoFechasLegible(desde, hasta);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="rotulo-tecnico text-xs text-tinta-suave">Mostrador</p>
          <h1 className="titulo-lamina mt-1 text-3xl sm:text-4xl">Back orders</h1>
          <p className="mt-1 text-sm text-tinta-suave">Lo que se le tiene pedido a Aldo Autopartes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Un <a> y no <Link>: es una descarga, no una pantalla que prefetchear. */}
          {pedidos.length > 0 && (
            <a href={urlExcel({ desde, hasta })} className={CLASE_EXPORTAR}>
              <FileSpreadsheet aria-hidden className="size-4" />
              Exportar a Excel
            </a>
          )}
          <NavegacionMes desde={desde} hasta={hasta} hoy={hoy} />
        </div>
      </div>

      {error && (
        <div role="alert" className="lamina border-anotacion px-5 py-4">
          <p className="rotulo-tecnico text-xs text-anotacion">No se pudieron leer las back orders</p>
          <p className="mt-1 text-sm text-tinta">{error}</p>
          <Link
            href={urlRango({ desde: desde ?? hoy, hasta: hasta ?? hoy })}
            className="mt-2 inline-block text-sm font-semibold underline underline-offset-4"
          >
            Volver a intentar
          </Link>
        </div>
      )}

      {pagina && pedidos.length === 0 && <Vacio rango={rango} />}

      {pedidos.length > 0 && (
        <TablaBackorders pedidos={pedidos} pie={<Pie visibles={pedidos.length} total={total} />} />
      )}
    </div>
  );
}
