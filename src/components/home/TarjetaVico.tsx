"use client";

import { abrirChat } from "@/components/BotonCotizar";
import { NEGOCIO } from "@/config/negocio";
import { AvatarVico } from "@/components/AvatarVico";

export function TarjetaVico() {
  return (
    <button
      type="button"
      onClick={() =>
        abrirChat("Hola, no sé cómo se llama la pieza que necesito. Te cuento: ")
      }
      className="panel-vitrina group relative mt-2.5 flex w-full items-center justify-between rounded-xl border border-white/15 bg-black/40 p-3.5 pr-[110px] pt-4 text-left transition-all duration-150 hover:border-ambar/60"
    >
      <div className="flex flex-col">
        <span className="text-[12px] font-medium leading-tight text-white/75">
          ¿No sabes cómo se llama la pieza?
        </span>
        <span className="mt-0.5 text-[13px] font-bold leading-tight text-white group-hover:text-[#f0d97d]">
          Cuéntaselo a {NEGOCIO.asistente} con tus palabras{" "}
          <span
            aria-hidden
            className="inline-block text-ambar transition-transform duration-150 group-hover:translate-x-1"
          >
            →
          </span>
        </span>
      </div>

      {/* Avatar sin fondo en tamaño grande elevado por arriba del card */}
      <div className="pointer-events-none absolute -top-10 right-1 z-10">
        <AvatarVico alto={110} />
      </div>
    </button>
  );
}
