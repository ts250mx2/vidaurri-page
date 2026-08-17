import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { PRELLENADOS, urlWhatsApp } from "@/config/negocio";
import { IconWhatsApp } from "@/components/IconWhatsApp";

// 404 en tono de taller: la página se chocó, pero la pieza seguramente existe.
// Ningún callejón sin salida — catálogo (ámbar, la acción) y WhatsApp (verde).
// El código del error va abajo, como una nota al pie del plano: nunca como
// etiqueta encima del título.
//
// Sin componentes cliente: solo Link y <a>.

export const metadata: Metadata = {
  title: "Página no encontrada",
};

export default function NoEncontrada() {
  return (
    <section className="sobre-plano relative isolate overflow-hidden bg-plano-hondo text-white">

      <div className="relative mx-auto flex max-w-3xl flex-col items-start px-4 py-24 md:py-32">
        <h1 className="titulo-lamina text-[clamp(2.6rem,8vw,5rem)]">
          Esta página se nos chocó.
        </h1>

        <p className="mt-6 max-w-[60ch] text-[15px] leading-relaxed text-white/75">
          La página que buscas no existe, pero tu pieza seguramente sí. Empieza
          por el catálogo o mándanos un mensaje y la localizamos contigo.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            href="/refacciones"
            className="rotulo-tecnico inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-ambar px-6 text-sm text-plano-hondo transition-colors duration-150 hover:bg-ambar-press active:bg-ambar-press"
          >
            <Search aria-hidden className="size-4" />
            Buscar mi pieza
          </Link>
          <a
            href={urlWhatsApp(PRELLENADOS.generico)}
            target="_blank"
            rel="noopener noreferrer"
            className="rotulo-tecnico inline-flex min-h-12 items-center gap-2 rounded-md bg-whatsapp px-6 text-sm text-plano-hondo transition-[filter] duration-150 hover:brightness-95 active:brightness-90"
          >
            <IconWhatsApp lado={18} />
            Cotizar por WhatsApp
          </a>
        </div>
        <p className="mt-3.5 text-xs text-white/70">
          Vico te cotiza al momento, 24/7.
        </p>

        <p className="num-tab mt-12 border-t border-white/15 pt-5 font-mono text-xs uppercase tracking-[0.16em] text-white/55">
          Error 404 · página no encontrada
        </p>
      </div>
    </section>
  );
}
