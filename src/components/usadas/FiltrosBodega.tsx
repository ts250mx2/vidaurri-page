import Link from "next/link";
import type { MarcaUsadas, ParteUsadas } from "@/lib/usadas";

// Filtros de la bodega de usado SIN JavaScript: un <form method="GET">
// renderizado en servidor que recarga /usadas con el querystring (marca,
// parte, texto, año). Los valores actuales llegan de searchParams y se
// preseleccionan con defaultValue. Al enviar, `pagina` se resetea sola porque
// no viaja en el formulario.
//
// Es el renglón de búsqueda del cajetín: casillas sobre papel, etiqueta
// rotulada arriba y 16px de tipo como mínimo (menos que eso hace que iOS se
// acerque solo al tocar el campo).

const ESTILO_CAMPO =
  "h-12 w-full rounded-md border border-linea bg-papel px-3 text-base text-tinta transition-colors duration-150 hover:border-linea-fuerte focus:border-tinta";

const ESTILO_ETIQUETA =
  "mb-1.5 block font-display text-[11px] font-bold uppercase leading-none tracking-[0.14em] text-tinta-suave";

export function FiltrosBodega({
  marcas,
  partes,
  valores,
}: {
  marcas: MarcaUsadas[];
  partes: ParteUsadas[];
  /** Valores actuales del querystring, ya normalizados ("" si no hay). */
  valores: { marca: string; parte: string; texto: string; anio: string };
}) {
  const hayFiltros = Boolean(
    valores.marca || valores.parte || valores.texto || valores.anio
  );

  return (
    <form
      method="GET"
      action="/usadas"
      aria-label="Filtros de piezas usadas"
      className="lamina p-5"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-3">
          <label htmlFor="filtro-marca" className={ESTILO_ETIQUETA}>
            Marca
          </label>
          <select
            id="filtro-marca"
            name="marca"
            defaultValue={valores.marca}
            className={ESTILO_CAMPO}
          >
            <option value="">Todas las marcas</option>
            {marcas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.marca}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-3">
          <label htmlFor="filtro-parte" className={ESTILO_ETIQUETA}>
            Tipo de pieza
          </label>
          <select
            id="filtro-parte"
            name="parte"
            defaultValue={valores.parte}
            className={ESTILO_CAMPO}
          >
            <option value="">Todas las piezas</option>
            {partes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.parte}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-3">
          <label htmlFor="filtro-texto" className={ESTILO_ETIQUETA}>
            ¿Qué buscas?
          </label>
          <input
            id="filtro-texto"
            type="search"
            name="texto"
            defaultValue={valores.texto}
            placeholder="Ej: puerta silverado"
            className={ESTILO_CAMPO}
          />
        </div>

        <div className="lg:col-span-1">
          <label htmlFor="filtro-anio" className={ESTILO_ETIQUETA}>
            Año
          </label>
          <input
            id="filtro-anio"
            type="number"
            inputMode="numeric"
            name="anio"
            min={1951}
            max={2099}
            defaultValue={valores.anio}
            placeholder="2018"
            className={`${ESTILO_CAMPO} num-tab font-mono`}
          />
        </div>

        <button
          type="submit"
          className="rotulo-tecnico h-12 rounded-md bg-ambar px-4 text-sm text-plano-hondo transition-colors duration-150 hover:bg-ambar-press active:bg-ambar-press lg:col-span-2"
        >
          Buscar
        </button>
      </div>

      {hayFiltros && (
        <p className="mt-3">
          <Link
            href="/usadas"
            className="inline-flex min-h-11 items-center text-[13px] font-semibold text-tinta-suave underline-offset-4 transition-colors duration-150 hover:text-tinta hover:underline"
          >
            Quitar todos los filtros
          </Link>
        </p>
      )}
    </form>
  );
}
