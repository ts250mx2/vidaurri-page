import Link from "next/link";
import { Camera } from "lucide-react";
import type { PiezaUsadaResumen } from "@/lib/usadas";
import { rangoAnios } from "@/lib/formato";
import { PRELLENADOS, urlWhatsApp } from "@/config/negocio";
import { FotoPieza } from "@/components/FotoPieza";
import { Precio } from "@/components/Precio";
import { BotonCotizar } from "@/components/BotonCotizar";
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
          src={p.foto ? `/api/usadas/foto?n=${encodeURIComponent(p.foto)}` : null}
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

      <div className="flex flex-1 flex-col p-4">
        <p className="num-tab truncate font-mono text-[15px] font-semibold leading-none tracking-tight text-tinta">
          {p.codigo}
        </p>

        <h3 className="mt-2 line-clamp-2 text-[13.5px] font-semibold leading-snug text-tinta">
          {p.descripcion}
        </h3>

        {(vehiculo || anios) && (
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-tinta-suave">
            {vehiculo && (
              <span className="rotulo-tecnico leading-none">{vehiculo}</span>
            )}
            {anios && <span className="num-tab font-mono leading-none">{anios}</span>}
          </p>
        )}

        {p.foto && (
          <p className="mt-2 text-[11px] leading-snug text-tinta-suave">
            Foto de la pieza exacta que te llevas
          </p>
        )}

        {/* Línea guía al renglón de precio. */}
        <div className="mt-auto flex flex-col items-start gap-2 border-t border-linea pt-3.5">
          <span className="sello sello-unica">Pieza única</span>
          {p.precioConIva ? (
            <Precio monto={p.precioConIva} />
          ) : (
            <span className="rotulo-tecnico text-lg leading-none text-tinta">
              Pregunta el precio
            </span>
          )}
        </div>

        <div className="relative z-20 mt-3.5 flex gap-2">
          <BotonCotizar
            mensaje={`Me interesa la pieza usada: ${nombre} (código ${p.codigo}). ¿Sigue disponible?`}
            className="min-w-0 flex-1"
          >
            Apártala
          </BotonCotizar>
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
