import type { MarcaUsadas, ParteUsadas } from "@/lib/usadas";

// Filtros del catalogo de usadas SIN JavaScript: un <form method="GET">
// server-rendered que recarga /usadas con el querystring (marca, parte,
// texto, anio). Los valores actuales llegan de searchParams y se preseleccionan
// con defaultValue. Al enviar, `pagina` se resetea sola (no viaja en el form).

const ESTILO_CAMPO =
  "h-12 w-full rounded-lg border border-borde bg-fondo px-3 text-base text-tinta transition-colors duration-150";

const ESTILO_ETIQUETA = "rotulo mb-1.5 block text-tinta-suave";

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
  return (
    <form
      method="GET"
      action="/usadas"
      aria-label="Filtros de piezas usadas"
      className="carta p-5"
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
            className={ESTILO_CAMPO}
          />
        </div>

        <button
          type="submit"
          className="h-12 rounded-lg bg-ambar px-4 font-display text-sm font-bold uppercase tracking-wide text-grafito transition-colors duration-150 hover:bg-ambar-press hover:text-white lg:col-span-2"
        >
          Buscar
        </button>
      </div>
    </form>
  );
}
