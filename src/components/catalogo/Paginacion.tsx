import Link from "next/link";

// Paginacion numerada SSR del catalogo: enlaces reales (rastreables) que
// conservan el path semantico y el querystring, con `pagina` como parametro.
// La pagina 1 omite `pagina` para mantener la URL canonica.

const CLASE_BASE =
  "inline-flex h-11 min-w-11 items-center justify-center rounded-lg px-3.5 font-mono text-sm num-tab transition-colors duration-150";
const CLASE_ENLACE = `${CLASE_BASE} border border-borde bg-superficie text-tinta hover:border-grafito hover:bg-grafito hover:text-white`;
const CLASE_ACTUAL = `${CLASE_BASE} border border-grafito bg-grafito font-semibold text-white`;
const CLASE_INACTIVO = `${CLASE_BASE} border border-borde bg-superficie text-tinta-suave opacity-45`;

/** Ventana de numeros con elipsis: 1 … n-1 [n] n+1 … total. */
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
      className="mt-8 flex flex-wrap items-center justify-center gap-1.5"
    >
      {pagina > 1 ? (
        <Link rel="prev" href={hrefDe(pagina - 1)} className={CLASE_ENLACE}>
          ‹ Anterior
        </Link>
      ) : (
        <span aria-disabled="true" className={CLASE_INACTIVO}>
          ‹ Anterior
        </span>
      )}

      {paginasVisibles(pagina, totalPaginas).map((el, i) =>
        el === "salto" ? (
          <span key={`salto-${i}`} aria-hidden className="px-1 text-tinta-suave">
            …
          </span>
        ) : el === pagina ? (
          <span key={el} aria-current="page" className={CLASE_ACTUAL}>
            {el}
          </span>
        ) : (
          <Link
            key={el}
            href={hrefDe(el)}
            aria-label={`Ir a la página ${el}`}
            className={CLASE_ENLACE}
          >
            {el}
          </Link>
        )
      )}

      {pagina < totalPaginas ? (
        <Link rel="next" href={hrefDe(pagina + 1)} className={CLASE_ENLACE}>
          Siguiente ›
        </Link>
      ) : (
        <span aria-disabled="true" className={CLASE_INACTIVO}>
          Siguiente ›
        </span>
      )}
    </nav>
  );
}
