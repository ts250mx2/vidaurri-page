import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Paginación numerada SSR del catálogo: enlaces reales (rastreables) que
// conservan el path semántico y el querystring, con `pagina` como parámetro.
// La página 1 omite `pagina` para mantener la URL canónica.
//
// Los números van en mono con cifras tabulares —son cotas, no texto— y las
// flechas son iconos de verdad, no glifos. La página actual se marca con el
// campo azul lleno: en el plano, lo que está resuelto va en tinta.

const CLASE_BASE =
  "inline-flex h-11 items-center justify-center gap-1.5 rounded-md border transition-colors duration-150";
const CLASE_TONO =
  "border-linea bg-hoja text-tinta hover:border-tinta hover:bg-plano hover:text-white";

const CLASE_NUM = `${CLASE_BASE} ${CLASE_TONO} num-tab min-w-11 px-3 font-mono text-sm`;
const CLASE_NUM_ACTUAL = `${CLASE_BASE} num-tab min-w-11 border-tinta bg-plano px-3 font-mono text-sm font-semibold text-white`;
const CLASE_NAV = `${CLASE_BASE} ${CLASE_TONO} rotulo-tecnico px-3.5 text-[13px]`;
const CLASE_NAV_INACTIVO = `${CLASE_BASE} rotulo-tecnico border-linea bg-hoja px-3.5 text-[13px] text-tinta-suave opacity-50`;

/** Ventana de números con elipsis: 1 … n-1 [n] n+1 … total. */
function paginasVisibles(actual: number, total: number): Array<number | "salto"> {
  const numeros: number[] = [];
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || Math.abs(p - actual) <= 1) numeros.push(p);
  }
  const conSaltos: Array<number | "salto"> = [];
  let previa = 0;
  for (const p of numeros) {
    if (previa && p - previa > 1) conSaltos.push("salto");
    conSaltos.push(p);
    previa = p;
  }
  return conSaltos;
}

export function Paginacion({
  pagina,
  totalPaginas,
  rutaBase,
  query,
}: {
  pagina: number;
  totalPaginas: number;
  /** Path semántico actual, p. ej. /refacciones/nissan/versa/2016. */
  rutaBase: string;
  /** Querystring a conservar (texto, parte, existencia), sin `pagina`. */
  query: Record<string, string>;
}) {
  if (totalPaginas <= 1) return null;

  const hrefDe = (p: number): string => {
    const qs = new URLSearchParams(query);
    if (p > 1) qs.set("pagina", String(p));
    const s = qs.toString();
    return `${rutaBase}${s ? `?${s}` : ""}`;
  };

  return (
    <nav
      aria-label="Paginación del catálogo"
      className="mt-10 flex flex-wrap items-center justify-center gap-1.5 border-t border-linea pt-6"
    >
      {pagina > 1 ? (
        <Link rel="prev" href={hrefDe(pagina - 1)} className={CLASE_NAV}>
          <ChevronLeft aria-hidden className="size-4" />
          Anterior
        </Link>
      ) : (
        <span aria-disabled="true" className={CLASE_NAV_INACTIVO}>
          <ChevronLeft aria-hidden className="size-4" />
          Anterior
        </span>
      )}

      {paginasVisibles(pagina, totalPaginas).map((el, i) =>
        el === "salto" ? (
          <span key={`salto-${i}`} aria-hidden className="px-1 text-tinta-suave">
            …
          </span>
        ) : el === pagina ? (
          <span key={el} aria-current="page" className={CLASE_NUM_ACTUAL}>
            {el}
          </span>
        ) : (
          <Link
            key={el}
            href={hrefDe(el)}
            aria-label={`Ir a la página ${el}`}
            className={CLASE_NUM}
          >
            {el}
          </Link>
        )
      )}

      {pagina < totalPaginas ? (
        <Link rel="next" href={hrefDe(pagina + 1)} className={CLASE_NAV}>
          Siguiente
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      ) : (
        <span aria-disabled="true" className={CLASE_NAV_INACTIVO}>
          Siguiente
          <ChevronRight aria-hidden className="size-4" />
        </span>
      )}
    </nav>
  );
}
