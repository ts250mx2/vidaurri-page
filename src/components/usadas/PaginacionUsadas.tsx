import Link from "next/link";
import clsx from "clsx";

// Paginacion numerada SSR del catalogo de usadas: enlaces reales que conservan
// los filtros activos en el querystring y solo cambian `pagina`. Sin JS.

const MAX_SIN_SALTOS = 7;

const ESTILO_BASE =
  "flex h-11 min-w-11 items-center justify-center rounded-lg border px-3.5 font-mono num-tab text-sm transition-colors duration-150";
const ESTILO_LINK =
  "border-borde bg-superficie text-tinta hover:border-grafito hover:bg-grafito hover:text-white";
const ESTILO_ACTUAL = "border-grafito bg-grafito text-white";

function hrefPagina(filtros: Record<string, string>, pagina: number): string {
  const params = new URLSearchParams(filtros);
  if (pagina > 1) params.set("pagina", String(pagina));
  const qs = params.toString();
  return qs ? `/usadas?${qs}` : "/usadas";
}

/** Numeros a mostrar: todos si son pocos; si no, extremos + vecinos del
 *  actual, con `null` como elipsis entre huecos. */
function paginasVisibles(actual: number, total: number): (number | null)[] {
  if (total <= MAX_SIN_SALTOS) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const candidatas = [1, actual - 1, actual, actual + 1, total].filter(
    (p) => p >= 1 && p <= total
  );
  const unicas = [...new Set(candidatas)].sort((a, b) => a - b);

  const conSaltos: (number | null)[] = [];
  for (const [i, pagina] of unicas.entries()) {
    if (i > 0 && pagina - unicas[i - 1] > 1) conSaltos.push(null);
    conSaltos.push(pagina);
  }
  return conSaltos;
}

export function PaginacionUsadas({
  paginaActual,
  totalPaginas,
  filtros,
}: {
  paginaActual: number;
  totalPaginas: number;
  /** Filtros activos a conservar en cada enlace (sin `pagina`). */
  filtros: Record<string, string>;
}) {
  if (totalPaginas <= 1) return null;

  return (
    <nav
      aria-label="Páginas de resultados"
      className="flex flex-wrap items-center justify-center gap-1.5"
    >
      {paginaActual > 1 && (
        <Link
          rel="prev"
          href={hrefPagina(filtros, paginaActual - 1)}
          aria-label="Página anterior"
          className={clsx(ESTILO_BASE, ESTILO_LINK)}
        >
          ←
        </Link>
      )}

      {paginasVisibles(paginaActual, totalPaginas).map((pagina, i) =>
        pagina === null ? (
          <span
            key={`salto-${i}`}
            aria-hidden
            className="px-1 text-sm text-tinta-suave"
          >
            …
          </span>
        ) : pagina === paginaActual ? (
          <span
            key={pagina}
            aria-current="page"
            className={clsx(ESTILO_BASE, ESTILO_ACTUAL)}
          >
            {pagina}
          </span>
        ) : (
          <Link
            key={pagina}
            href={hrefPagina(filtros, pagina)}
            aria-label={`Ir a la página ${pagina}`}
            className={clsx(ESTILO_BASE, ESTILO_LINK)}
          >
            {pagina}
          </Link>
        )
      )}

      {paginaActual < totalPaginas && (
        <Link
          rel="next"
          href={hrefPagina(filtros, paginaActual + 1)}
          aria-label="Página siguiente"
          className={clsx(ESTILO_BASE, ESTILO_LINK)}
        >
          →
        </Link>
      )}
    </nav>
  );
}
