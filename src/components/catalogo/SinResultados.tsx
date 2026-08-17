import { SearchX } from "lucide-react";
import { PRELLENADOS, urlWhatsApp } from "@/config/negocio";
import { BotonCotizar } from "@/components/BotonCotizar";
import { IconWhatsApp } from "@/components/IconWhatsApp";

// Bloque de rescate para cero resultados (regla dura #2: los callejones sin
// salida no existen). Siempre ofrece WhatsApp con el termino buscado y el
// chat de Vico con el contexto precargado.

export function SinResultados({ termino }: { termino: string }) {
  return (
    <section
      aria-label="Sin resultados"
      className="carta trama-rejilla px-5 py-12 text-center md:py-16"
    >
      <span className="mx-auto flex size-14 items-center justify-center rounded-xl border border-borde bg-fondo">
        <SearchX aria-hidden className="size-6 text-tinta-suave" />
      </span>

      <h2 className="titulo-cartel mt-5 text-[clamp(1.6rem,3.5vw,2.25rem)]">
        ¿No la encuentras?
      </h2>
      <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-tinta-suave">
        Tenemos 42,000 piezas y conseguimos sobre pedido. Mándanos lo que buscas
        tal cual lo conoces y la localizamos contigo.
      </p>

      <div className="mx-auto mt-7 flex max-w-xs flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-center">
        <a
          href={urlWhatsApp(PRELLENADOS.sinResultados(termino))}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-whatsapp px-6 py-3.5 font-display text-sm font-bold uppercase tracking-wide text-white transition-opacity duration-150 hover:opacity-90"
        >
          <IconWhatsApp lado={18} />
          Búscala por WhatsApp
        </a>
        <BotonCotizar
          mensaje={`Hola, busqué "${termino}" en el catálogo y no aparece. ¿La pueden conseguir?`}
          className="px-6"
        >
          Pregúntale a Vico
        </BotonCotizar>
      </div>

      <p className="mt-5 text-[13px] text-tinta-suave">
        Respondemos en minutos en horario hábil · El asistente cotiza 24/7
      </p>
    </section>
  );
}
