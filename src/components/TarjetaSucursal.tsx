import { Clock, MapPin, Phone } from "lucide-react";
import { NEGOCIO } from "@/config/negocio";

// Ficha de sucursal: la misma en la home y en /sucursales. Cabecera en campo
// azul con el nombre rotulado, el cuerpo como ficha técnica (dirección y
// horario) y los dos botones útiles. Los datos salen TAL CUAL de
// src/config/negocio.ts — aquí no se agrega ni se completa nada.
//
// Sin numeral 01/02 en la cabecera: el orden de las sucursales no es
// información, y un número que no significa nada es decoración.

export interface Sucursal {
  nombre: string;
  direccion: string;
  /** Opcionales a propósito: mientras el cliente no confirme la línea directa
   *  y el horario de cada sucursal, no se publican. Publicar el teléfono de la
   *  matriz en las dos manda a quien llama a Fierro con la matriz, y un horario
   *  equivocado deja a alguien parado frente a una cortina cerrada. */
  telefono?: string;
  horario?: string;
  mapsUrl: string;
}

const CLASE_BOTON =
  "rotulo-tecnico inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-md border border-linea bg-hoja px-4 py-2.5 text-[13px] leading-none text-tinta transition-colors duration-150 hover:border-tinta hover:bg-papel";

const CLASE_ROTULO = "rotulo-tecnico text-[11px] leading-none text-tinta-suave";

export function TarjetaSucursal({
  sucursal,
  como: Como = "h3",
}: {
  sucursal: Sucursal;
  /** Ignorada. Se conserva para no romper a quien todavía la pasa. */
  indice?: number;
  como?: "h2" | "h3";
}) {
  return (
    <article className="lamina flex flex-col overflow-hidden">
      <div className="bg-plano px-5 py-4 text-white">
        <Como className="rotulo-tecnico text-xl leading-none">
          {sucursal.nombre}
        </Como>
      </div>

      <dl className="flex-1 divide-y divide-linea px-5 text-sm">
        <div className="flex items-start gap-3 py-4">
          <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-tinta-suave" />
          <div>
            <dt className={CLASE_ROTULO}>Dirección</dt>
            <dd className="mt-1.5 leading-relaxed text-tinta">{sucursal.direccion}</dd>
          </div>
        </div>
        {sucursal.horario && (
          <div className="flex items-start gap-3 py-4">
            <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-tinta-suave" />
            <div>
              <dt className={CLASE_ROTULO}>Horario</dt>
              <dd className="mt-1.5 leading-relaxed text-tinta">{sucursal.horario}</dd>
            </div>
          </div>
        )}
      </dl>

      <div className="flex flex-wrap gap-2.5 border-t border-linea bg-papel p-4">
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
        {/* Sin línea propia confirmada se ofrece la de la casa, rotulada como
            tal: nunca la de la matriz disfrazada de teléfono de esta sucursal. */}
        <a
          href={`tel:${sucursal.telefono ?? NEGOCIO.telefono}`}
          aria-label={
            sucursal.telefono
              ? `Llamar a ${sucursal.nombre}`
              : `Llamar a Autopartes Vidaurri`
          }
          className={CLASE_BOTON}
        >
          <Phone aria-hidden className="size-4" />
          {sucursal.telefono ? "Llamar" : "Llamar a la casa"}
        </a>
      </div>
    </article>
  );
}
