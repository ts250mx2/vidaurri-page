import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { paginasVisibles } from "@/components/catalogo/Paginacion";
import { urlCola, type FiltrosBase } from "@/lib/mostrador/filtros";
import { SelectorPorPagina } from "./SelectorPorPagina";

// Pie de la tabla de la cola, dentro de la misma lámina que la tabla: a la
// izquierda qué tramo se está viendo ("Mostrando 1–50 de 116 pedidos", o
// "16 pedidos" a secas cuando caben todos), al centro la paginación compacta
// (‹ 1 2 3 ›) y a la derecha el selector de tamaño de página. Las cifras van
// en mono tabular: son cotas. Todo se calcula con el `porPagina` EFECTIVO que
// devolvió IA, no con el que pidió la URL: si IA acotó (o ignoró) el
// parámetro, los números y las páginas siguen cuadrando con lo que llegó.
// La paginación reusa la ventana con elipsis del catálogo (`paginasVisibles`)
// pero en chico: solo flechas y números, que en un pie no cabe "Anterior".

const CLASE_PAG =
  "num-tab inline-flex h-10 min-w-10 items-center justify-center rounded-md border px-2.5 font-mono text-sm transition-colors duration-150";
const CLASE_PAG_ENLACE = clsx(
  CLASE_PAG,
  "border-linea bg-hoja text-tinta hover:border-tinta hover:bg-plano hover:text-white"
);
const CLASE_PAG_ACTUAL = clsx(CLASE_PAG, "border-tinta bg-plano font-semibold text-white");
const CLASE_PAG_INACTIVO = clsx(CLASE_PAG, "border-linea bg-hoja text-tinta-suave opacity-50");
const CLASE_CIFRA = "font-mono font-semibold text-tinta";

function cifra(n: number): string {
  return n.toLocaleString("es-MX");
}

function Flecha({
  hacia,
  href,
  etiqueta,
}: {
  hacia: "anterior" | "siguiente";
  /** null cuando no hay a dónde ir: se pinta apagada. */
  href: string | null;
  etiqueta: string;
}) {
  const Icono = hacia === "anterior" ? ChevronLeft : ChevronRight;
  if (!href) {
    return (
      <span role="link" aria-disabled="true" aria-label={etiqueta} className={CLASE_PAG_INACTIVO}>
        <Icono aria-hidden className="size-4" />
      </span>
    );
  }
  return (
    <Link
      rel={hacia === "anterior" ? "prev" : "next"}
      href={href}
      aria-label={etiqueta}
      className={CLASE_PAG_ENLACE}
    >
      <Icono aria-hidden className="size-4" />
    </Link>
  );
}

function PaginacionCompacta({
  pagina,
  totalPaginas,
  base,
}: {
  pagina: number;
  totalPaginas: number;
  base: FiltrosBase;
}) {
  if (totalPaginas <= 1) return null;
  return (
    <nav aria-label="Paginación de la cola" className="flex items-center gap-1">
      <Flecha
        hacia="anterior"
        href={pagina > 1 ? urlCola(base, pagina - 1) : null}
        etiqueta="Página anterior"
      />
      {paginasVisibles(pagina, totalPaginas).map((el, i) =>
        el === "salto" ? (
          <span key={`salto-${i}`} aria-hidden className="px-1 text-tinta-suave">
            …
          </span>
        ) : el === pagina ? (
          <span key={el} aria-current="page" className={CLASE_PAG_ACTUAL}>
            {el}
          </span>
        ) : (
          <Link
            key={el}
            href={urlCola(base, el)}
            aria-label={`Ir a la página ${el}`}
            className={CLASE_PAG_ENLACE}
          >
            {el}
          </Link>
        )
      )}
      <Flecha
        hacia="siguiente"
        href={pagina < totalPaginas ? urlCola(base, pagina + 1) : null}
        etiqueta="Página siguiente"
      />
    </nav>
  );
}

export function PieTabla({
  total,
  pagina,
  porPagina,
  base,
}: {
  total: number;
  pagina: number;
  /** Tamaño de página efectivo según IA (con "todos" es su tope). */
  porPagina: number;
  base: FiltrosBase;
}) {
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const desde = (pagina - 1) * porPagina + 1;
  const hasta = Math.min(pagina * porPagina, total);
  const sustantivo = total === 1 ? "pedido" : "pedidos";

  return (
    <div className="grid grid-cols-1 items-center gap-3 border-t border-linea px-4 py-3 sm:grid-cols-[1fr_auto_1fr]">
      <p className="num-tab text-sm text-tinta-suave">
        {totalPaginas > 1 ? (
          <>
            Mostrando{" "}
            <span className={CLASE_CIFRA}>
              {cifra(desde)}–{cifra(hasta)}
            </span>{" "}
            de <span className={CLASE_CIFRA}>{cifra(total)}</span> {sustantivo}
          </>
        ) : (
          <>
            <span className={CLASE_CIFRA}>{cifra(total)}</span> {sustantivo}
          </>
        )}
      </p>
      <div className="justify-self-center">
        <PaginacionCompacta pagina={pagina} totalPaginas={totalPaginas} base={base} />
      </div>
      <div className="sm:justify-self-end">
        <SelectorPorPagina key={urlCola(base)} base={base} />
      </div>
    </div>
  );
}
