import Link from "next/link";
import { CheckCircle2, Sparkles } from "lucide-react";
import type { ProductoResumen } from "@/lib/catalogo";
import { rangoAnios } from "@/lib/formato";
import { FotoPieza } from "@/components/FotoPieza";

export function TarjetaProducto({ p }: { p: ProductoResumen }) {
  const anios = rangoAnios(p.aini, p.afin);
  const alt = [p.descripcion, p.marca, anios].filter(Boolean).join(" ");

  return (
    <article className="tarjeta-oscura group relative flex flex-col overflow-hidden text-white">
      <Link
        href={`/pieza/${encodeURIComponent(p.codigo)}`}
        className="absolute inset-0 z-10"
        aria-label={`${p.descripcion} — ver pieza y precio`}
      />

      {/* Escenario de exhibición de foto en penumbra */}
      <div className="relative border-b border-white/10 bg-gradient-to-b from-black/60 to-black/30">
        <FotoPieza
          src={`/api/foto?codigo=${encodeURIComponent(p.foto)}`}
          alt={alt}
          className="aspect-[4/3] w-full"
          imgClassName="p-3 transition-transform duration-200 group-hover:scale-105"
        />
        {/* Placa de latón: es lo primero que el ojo agarra al barrer la
            parrilla, así que se gana el metal en vez de un recuadro blanco. */}
        <span className="etiqueta-origen etiqueta-nueva absolute left-3 top-3">
          <Sparkles aria-hidden className="size-3.5" />
          NUEVA
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* Título de la pieza */}
        <h3 className="line-clamp-1 font-display text-[17px] font-bold tracking-tight text-white group-hover:text-[#f0d97d] transition-colors">
          {p.descripcion}
        </h3>

        {/* Estatus e indicadores en verde */}
        <div className="mt-2.5 flex items-center gap-2 text-[11.5px] font-bold text-emerald-400 uppercase tracking-wide">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="size-3.5 fill-emerald-400 text-black" />
            NUEVA
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="size-3.5 fill-emerald-400 text-black" />
            EN EXISTENCIA
          </span>
        </div>

        {/* Botón VER DETALLES en degradado metálico plateado */}
        <div className="relative z-20 mt-4 pt-1">
          <button
            type="button"
            className="boton-metal-plata flex h-10 w-full items-center justify-center rounded-lg text-[12px] font-extrabold tracking-wider"
          >
            VER DETALLES
          </button>
        </div>
      </div>
    </article>
  );
}
