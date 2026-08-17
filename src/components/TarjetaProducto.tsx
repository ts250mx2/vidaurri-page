import Link from "next/link";
import type { ProductoResumen } from "@/lib/catalogo";
import { rangoAnios } from "@/lib/formato";
import { PRELLENADOS, urlWhatsApp } from "@/config/negocio";
import { FotoPieza } from "@/components/FotoPieza";
import { Precio } from "@/components/Precio";
import { BotonCotizar } from "@/components/BotonCotizar";
import { IconWhatsApp } from "@/components/IconWhatsApp";

// Tarjeta de producto NUEVO. Toda la tarjeta navega a la ficha; los CTAs
// (Cotizar por chat / WhatsApp) quedan por encima del enlace de la tarjeta.

export function TarjetaProducto({ p }: { p: ProductoResumen }) {
  const anios = rangoAnios(p.aini, p.afin);
  const nombre = `${p.descripcion}${anios ? ` ${anios}` : ""}`;

  return (
    <article className="carta carta-enlace group relative flex flex-col overflow-hidden">
      <Link
        href={`/pieza/${encodeURIComponent(p.codigo)}`}
        className="absolute inset-0 z-10"
        aria-label={`${p.descripcion} — ver pieza y precio`}
      />

      <div className="trama-anaquel relative border-b border-borde">
        <FotoPieza
          src={`/api/foto?codigo=${encodeURIComponent(p.foto)}`}
          alt={p.descripcion}
          className="aspect-[4/3] w-full"
          imgClassName="p-3 transition-transform duration-150 group-hover:scale-105"
        />
        <span className="absolute left-2.5 top-2.5 rounded-md bg-grafito px-2 py-1 font-display text-[10px] font-bold uppercase tracking-[0.1em] text-white">
          Nueva
        </span>
        {p.enExistencia && (
          <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-md border border-borde bg-superficie px-2 py-1 font-display text-[10px] font-bold uppercase tracking-[0.06em] text-exito shadow-carta">
            <span aria-hidden className="size-1.5 rounded-full bg-exito" />
            En existencia
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="num-tab font-mono text-[11px] text-tinta-suave">{p.codigo}</p>
        <h3 className="mt-1 line-clamp-2 text-[14px] font-semibold leading-snug">
          {p.descripcion}
        </h3>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-tinta-suave">
          {p.marca && (
            <span className="font-display font-semibold uppercase tracking-[0.06em]">
              {p.marca}
            </span>
          )}
          {anios && (
            <span className="num-tab rounded-full border border-borde bg-fondo px-2 py-px font-mono">
              {anios}
            </span>
          )}
        </div>

        <div className="mt-auto pt-3.5">
          <Precio monto={p.precioConIva} />
        </div>

        <div className="relative z-20 mt-3 flex gap-2">
          <BotonCotizar
            mensaje={`Quiero cotizar: ${nombre} (código ${p.codigo})`}
            className="flex-1 px-2 py-2.5 text-[12.5px]"
          />
          <a
            href={urlWhatsApp(PRELLENADOS.pieza(nombre, p.codigo))}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Cotizar ${p.descripcion} por WhatsApp`}
            className="flex w-11 shrink-0 items-center justify-center rounded-lg bg-whatsapp text-white transition-opacity hover:opacity-90"
          >
            <IconWhatsApp lado={18} />
          </a>
        </div>
      </div>
    </article>
  );
}
