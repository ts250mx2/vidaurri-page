import Link from "next/link";
import { Camera } from "lucide-react";
import type { PiezaUsadaResumen } from "@/lib/usadas";
import { fechaCorta, rangoAnios } from "@/lib/formato";
import { PRELLENADOS, urlWhatsApp } from "@/config/negocio";
import { urlFotoUsada } from "@/lib/fotos";
import { FotoPieza } from "@/components/FotoPieza";
import { Precio } from "@/components/Precio";
import { IconWhatsApp } from "@/components/IconWhatsApp";

// La misma ficha de partida, pero de la bodega de USADO. Dos cosas la separan
// de la nueva y las dos son verdad: la foto es de la pieza exacta que se
// entrega (no de catálogo) y la pieza es única — cuando se va, se acabó. Por
// eso aquí manda la tinta de anotación: el rojo del ajustador marca lo
// irrepetible. La escasez no se fabrica, se sella.

// En la parrilla de la portada caben cuatro piezas por renglón: esas son las
// que el cliente ya tiene enfrente, así que su foto no se difiere. De la quinta
// en adelante la descarga espera a que el celular llegue ahí.
const FOTOS_INMEDIATAS = 4;

export function TarjetaUsada({
  p,
  indice,
}: {
  p: PiezaUsadaResumen;
  /** Posición en la parrilla, si quien la usa la conoce. Solo decide si la
   *  foto se descarga de inmediato o diferida. */
  indice?: number;
}) {
  const anios = rangoAnios(p.anioInicio, p.anioFin);
  const fechaAlta = fechaCorta(p.fechaAlta);
  const vehiculo = [p.marca, p.modelo].filter(Boolean).join(" ");
  const nombre = `${p.descripcion}${vehiculo ? ` ${vehiculo}` : ""}`;
  const alt = `Foto real de la pieza usada: ${[p.descripcion, vehiculo, anios]
    .filter(Boolean)
    .join(" ")}`;

  return (
    <article className="lamina lamina-enlace group relative flex flex-col overflow-hidden">
      <Link
        href={`/usadas/${p.id}`}
        className="absolute inset-0 z-10"
        aria-label={`${p.descripcion} usada — ver fotos y precio`}
      />

      {/* El hueco de la foto va con su proporción fija: la caja existe desde el
          primer pintado, así que cuando entra la imagen nada se recorre. */}
      <div className="relative border-b border-linea bg-papel-hondo">
        <FotoPieza
          src={p.foto ? urlFotoUsada(p.foto) : null}
          alt={alt}
          prioritaria={typeof indice === "number" && indice < FOTOS_INMEDIATAS}
          className="aspect-[4/3] w-full"
          imgClassName="object-cover transition-transform duration-150 group-hover:scale-[1.04]"
        />
        {/* Misma placa que la nueva, en tinta de anotación: una pieza única no
            es lo mismo que una de anaquel, y a esa distancia el color es lo que
            las separa de un vistazo. */}
        <span className="etiqueta-origen etiqueta-usada absolute left-2.5 top-2.5">
          Usada
        </span>
        {p.numFotos > 0 && (
          <span className="rotulo-tecnico absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-sm bg-plano-hondo/85 px-2 py-1 text-[10.5px] leading-none text-white">
            <Camera aria-hidden className="size-3" />
            <span className="num-tab">{p.numFotos}</span>
            {p.numFotos === 1 ? "foto" : "fotos"}
          </span>
        )}
      </div>

      {/* El cuerpo sigue el orden de la tarjeta del sistema de la bodega, que
          es como el mostrador ya lee sus piezas: ID y fecha de alta, la
          descripción completa tal cual está capturada, años, pines, precio y
          origen. La ubicación en bodega se queda fuera a propósito. */}
      <div className="flex flex-1 flex-col p-4 text-[13px] leading-snug text-tinta">
        <p className="flex items-baseline justify-between gap-3">
          <span className="num-tab font-mono text-[14px] font-semibold tracking-tight">
            <span className="text-tinta-suave">ID pieza: </span>
            {p.id}
          </span>
          {fechaAlta && (
            <span className="num-tab shrink-0 font-mono text-[11px] text-tinta-suave">
              ({fechaAlta})
            </span>
          )}
        </p>

        <h3 className="mt-2 line-clamp-3 text-[13.5px] font-semibold leading-snug">
          {p.descripcion}
        </h3>

        {anios && (
          <p className="num-tab mt-1 font-mono text-[13px]">{anios}</p>
        )}

        {p.numeroParte && (
          <p className="mt-1 truncate">
            <span className="text-tinta-suave">Núm. parte: </span>
            <span className="num-tab font-mono">{p.numeroParte}</span>
          </p>
        )}

        {p.pines && (
          <p className="mt-1">
            <span className="text-tinta-suave">Pines: </span>
            <span className="num-tab font-mono">{p.pines}</span>
          </p>
        )}

        <div className="mt-3 flex flex-col items-start gap-1.5">
          {p.precioConIva ? (
            <Precio monto={p.precioConIva} />
          ) : (
            <span className="rotulo-tecnico text-lg leading-none">Pregunta el precio</span>
          )}
          {p.origen && (
            <span className="rotulo-tecnico text-[12px] leading-none text-tinta">
              {p.origen}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center gap-2 border-t border-linea pt-3">
          <span className="sello sello-unica">Pieza única</span>
          {p.foto && (
            <span className="text-[11px] leading-snug text-tinta-suave">
              Foto de la pieza exacta
            </span>
          )}
        </div>

        <div className="relative z-20 mt-3.5 flex gap-2">
          <Link
            href={`/usadas/${p.id}`}
            className="rotulo-tecnico flex h-11 min-w-0 flex-1 items-center justify-center rounded-md border border-linea bg-hoja px-4 text-sm text-tinta transition-colors duration-150 hover:border-tinta hover:bg-papel"
          >
            Ver detalle
          </Link>
          <a
            href={urlWhatsApp(PRELLENADOS.usada(nombre, p.codigo))}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Preguntar por ${p.descripcion} usada por WhatsApp`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-whatsapp text-plano-hondo transition-[filter] duration-150 hover:brightness-95 active:brightness-90"
          >
            <IconWhatsApp lado={18} />
          </a>
        </div>

        <p className="mt-2 text-[11px] leading-snug text-tinta-suave">
          Te confirmamos si sigue disponible y te mandamos más fotos.
        </p>
      </div>
    </article>
  );
}
