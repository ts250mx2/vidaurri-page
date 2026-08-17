import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { PRELLENADOS, urlWhatsApp } from "@/config/negocio";
import { IconWhatsApp } from "@/components/IconWhatsApp";

// 404 en tono del taller: la página se chocó, pero la pieza seguramente
// existe. Rescate con Link al catálogo (ámbar) y WhatsApp (verde) — sin
// componentes cliente: solo Link y <a>.

export const metadata: Metadata = {
  title: "Página no encontrada",
};

export default function NoEncontrada() {
  return (
    <section className="sobre-grafito relative isolate overflow-hidden bg-grafito-hondo text-white">
      <span
        aria-hidden
        className="trama-rejilla-oscura absolute inset-0 opacity-70"
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-start px-4 py-24 md:py-32">
        <p className="rotulo text-white/60">Error 404</p>

        <h1 className="titulo-cartel mt-4 text-[clamp(2.6rem,8vw,5rem)]">
          Esta página se nos <span className="placa-ambar">chocó</span>.
        </h1>

        <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-slate-300">
          La página que buscas no existe, pero tu pieza seguramente sí. Empieza
          por el catálogo o mándanos un mensaje y la localizamos contigo.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/refacciones"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-ambar px-6 py-3.5 font-display text-sm font-bold uppercase tracking-wide text-grafito transition-colors duration-150 hover:bg-ambar-press hover:text-white"
          >
            <Search aria-hidden className="size-4" />
            Buscar mi pieza
          </Link>
          <a
            href={urlWhatsApp(PRELLENADOS.generico)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-whatsapp px-6 py-3.5 font-display text-sm font-bold uppercase tracking-wide text-white transition-opacity duration-150 hover:opacity-90"
          >
            <IconWhatsApp lado={18} />
            Cotizar por WhatsApp
          </a>
        </div>
        <p className="mt-3.5 text-xs text-slate-400">
          Respondemos en minutos en horario hábil.
        </p>
      </div>
    </section>
  );
}
