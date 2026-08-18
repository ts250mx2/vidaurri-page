import Link from "next/link";
import { CheckCircle2, Sparkles } from "lucide-react";
import type { ProductoResumen } from "@/lib/catalogo";
import { rangoAnios, pesos } from "@/lib/formato";
import { FotoPieza } from "@/components/FotoPieza";

// Ficha de la parrilla de búsqueda. Lleva lo que el cliente necesita para
// decidir sin abrir la pieza: qué es, para qué carro, su número de parte —así
// se pide en el mostrador— y el precio con IVA, que es la pregunta real.

export function TarjetaProducto({ p }: { p: ProductoResumen }) {
  const anios = rangoAnios(p.aini, p.afin);
  const alt = [p.descripcion, p.marca, anios].filter(Boolean).join(" ");

  return (
    <article className="tarjeta-oscura group relative flex flex-col overflow-hidden text-white">
      <Link
        href={`/pieza/${encodeURIComponent(p.codigo)}`}
        className="absolute inset-0 z-10"
        aria-label={`${p.descripcion} — ${pesos(p.precioConIva)} con IVA incluido`}
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
        <h3 className="line-clamp-2 font-display text-[15px] font-bold leading-snug tracking-tight text-white transition-colors group-hover:text-[#f0d97d]">
          {p.descripcion}
        </h3>

        {/* Para qué carro es y su número de parte: los dos datos con los que
            un taller confirma que la pieza es la suya. */}
        {(p.marca || anios) && (
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-white/60">
            {p.marca && (
              <span className="rotulo-tecnico text-white/80">{p.marca}</span>
            )}
            {anios && <span className="num-tab font-mono">{anios}</span>}
          </p>
        )}
        <p className="num-tab mt-1 truncate font-mono text-[11.5px] text-white/45">
          {p.codigo}
        </p>

        {/* EL PRECIO — la pregunta real de quien busca. Va con su IVA pegado,
            nunca en letra chica: es la promesa del mostrador. */}
        <div className="mt-auto pt-3.5">
          <p className="num-tab font-display text-[1.65rem] font-extrabold leading-none tracking-tight text-white">
            {pesos(p.precioConIva)}
          </p>
          <p className="rotulo-tecnico mt-1 text-[10.5px] leading-none text-white/55">
            IVA incluido
          </p>
        </div>

        {/* La existencia se afirma SOLO cuando la hay: antes el renglón se
            pintaba siempre y prometía anaquel en piezas que no lo tienen. */}
        {p.enExistencia && (
          <p className="mt-3 flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide text-emerald-400">
            <CheckCircle2 aria-hidden className="size-3.5 fill-emerald-400 text-black" />
            En existencia
          </p>
        )}

        {/* Es el rótulo del enlace que cubre la tarjeta, no un control aparte:
            va como texto para no anidar dos elementos interactivos. */}
        <span
          aria-hidden
          className="boton-metal-plata mt-4 flex h-10 w-full items-center justify-center rounded-lg text-[12px] font-extrabold tracking-wider"
        >
          VER DETALLES
        </span>
      </div>
    </article>
  );
}
