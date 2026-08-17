import Link from "next/link";
import { Camera } from "lucide-react";
import type { PiezaUsadaResumen } from "@/lib/usadas";
import { rangoAnios } from "@/lib/formato";
import { PRELLENADOS, urlWhatsApp } from "@/config/negocio";
import { FotoPieza } from "@/components/FotoPieza";
import { Precio } from "@/components/Precio";
import { BotonCotizar } from "@/components/BotonCotizar";
import { IconWhatsApp } from "@/components/IconWhatsApp";

// Tarjeta de pieza USADA: foto real de la pieza exacta, badge ambar y la
// escasez legitima (cada usada es unica). Enlaza a /usadas/[id].
// El badge ambar aqui es la excepcion heredada de la ficha: marca la pieza
// unica, que es justo lo que empuja a apartarla.

export function TarjetaUsada({ p }: { p: PiezaUsadaResumen }) {
  const anios = rangoAnios(p.anioInicio, p.anioFin);
  const vehiculo = [p.marca, p.modelo].filter(Boolean).join(" ");
  const nombre = `${p.descripcion}${vehiculo ? ` ${vehiculo}` : ""}`;

  return (
    <article className="carta carta-enlace group relative flex flex-col overflow-hidden">
      <Link
        href={`/usadas/${p.id}`}
        className="absolute inset-0 z-10"
        aria-label={`${p.descripcion} usada — ver fotos y precio`}
      />

      <div className="relative border-b border-borde bg-fondo">
        <FotoPieza
          src={p.foto ? `/api/usadas/foto?n=${encodeURIComponent(p.foto)}` : null}
          alt={`Foto real: ${p.descripcion}`}
          className="aspect-[4/3] w-full"
          imgClassName="object-cover transition-transform duration-150 group-hover:scale-105"
        />
        <span className="absolute left-2.5 top-2.5 rounded-md bg-ambar px-2 py-1 font-display text-[10px] font-bold uppercase tracking-[0.1em] text-grafito">
          Usada
        </span>
        {p.numFotos > 0 && (
          <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-md bg-grafito/85 px-2 py-1 font-display text-[10px] font-bold uppercase tracking-[0.06em] text-white">
            <Camera aria-hidden className="size-3" />
            {p.numFotos} {p.numFotos === 1 ? "foto" : "fotos"}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="num-tab font-mono text-[11px] text-tinta-suave">{p.codigo}</p>
        <h3 className="mt-1 line-clamp-2 text-[14px] font-semibold leading-snug">
          {p.descripcion}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-tinta-suave">
          {vehiculo && (
            <span className="font-display font-semibold uppercase tracking-[0.06em]">
              {vehiculo}
            </span>
          )}
          {anios && (
            <span className="num-tab rounded-full border border-borde bg-fondo px-2 py-px font-mono">
              {anios}
            </span>
          )}
        </div>

        <div className="mt-auto pt-3.5">
          {p.precioConIva ? (
            <Precio monto={p.precioConIva} />
          ) : (
            <span className="titulo-display text-base text-tinta-suave">
              Pregunta el precio
            </span>
          )}
        </div>

        <div className="relative z-20 mt-3 flex gap-2">
          <BotonCotizar
            mensaje={`Me interesa la pieza usada: ${nombre} (código ${p.codigo}). ¿Sigue disponible?`}
            className="flex-1 px-2 py-2.5 text-[12.5px]"
          >
            Apártala
          </BotonCotizar>
          <a
            href={urlWhatsApp(PRELLENADOS.usada(nombre, p.codigo))}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Preguntar por ${p.descripcion} por WhatsApp`}
            className="flex w-11 shrink-0 items-center justify-center rounded-lg bg-whatsapp text-white transition-opacity hover:opacity-90"
          >
            <IconWhatsApp lado={18} />
          </a>
        </div>
      </div>
    </article>
  );
}
