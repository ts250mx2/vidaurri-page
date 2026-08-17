import { Clock, MapPin, Phone } from "lucide-react";

// Ficha de sucursal: la misma en la home y en /sucursales. Cabecera grafito con
// el numeral de anaquel, el cuerpo como ficha técnica (dirección y horario) y
// los dos botones útiles. Los datos salen TAL CUAL de src/config/negocio.ts —
// aquí no se agrega ni se completa nada.

export interface Sucursal {
  nombre: string;
  direccion: string;
  telefono: string;
  horario: string;
  mapsUrl: string;
}

const CLASE_BOTON =
  "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-borde bg-superficie px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-tinta transition-colors duration-150 hover:border-grafito";

export function TarjetaSucursal({
  sucursal,
  indice,
  como: Como = "h3",
}: {
  sucursal: Sucursal;
  /** Posición en la lista, para el numeral de la cabecera. */
  indice: number;
  como?: "h2" | "h3";
}) {
  return (
    <article className="carta flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 bg-grafito px-5 py-3.5 text-white">
        <span
          aria-hidden
          className="titulo-cartel num-tab text-2xl leading-none text-white/35"
        >
          {String(indice + 1).padStart(2, "0")}
        </span>
        <Como className="titulo-display text-xl leading-none">
          {sucursal.nombre}
        </Como>
      </div>

      <dl className="flex-1 divide-y divide-borde px-5 text-sm">
        <div className="flex items-start gap-3 py-4">
          <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-tinta-suave" />
          <div>
            <dt className="rotulo text-tinta-suave">Dirección</dt>
            <dd className="mt-1 leading-relaxed">{sucursal.direccion}</dd>
          </div>
        </div>
        <div className="flex items-start gap-3 py-4">
          <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-tinta-suave" />
          <div>
            <dt className="rotulo text-tinta-suave">Horario</dt>
            <dd className="mt-1 leading-relaxed">{sucursal.horario}</dd>
          </div>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2.5 border-t border-borde bg-fondo p-4">
        <a
          href={sucursal.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Cómo llegar a ${sucursal.nombre}`}
          className={CLASE_BOTON}
        >
          <MapPin aria-hidden className="size-4" />
          Cómo llegar
        </a>
        <a
          href={`tel:${sucursal.telefono}`}
          aria-label={`Llamar a ${sucursal.nombre}`}
          className={CLASE_BOTON}
        >
          <Phone aria-hidden className="size-4" />
          Llamar
        </a>
      </div>
    </article>
  );
}
