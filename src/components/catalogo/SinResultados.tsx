import { SearchX } from "lucide-react";
import { PRELLENADOS, urlWhatsApp } from "@/config/negocio";
import { BotonCotizar } from "@/components/BotonCotizar";
import { IconWhatsApp } from "@/components/IconWhatsApp";

// La lámina en blanco: cuando la búsqueda no devuelve partidas, la hoja no se
// queda vacía — se convierte en la orden de búsqueda. Ningún callejón sin
// salida: siempre WhatsApp con el término ya escrito y el chat de Vico con el
// contexto cargado.

export function SinResultados({ termino }: { termino: string }) {
  return (
    <section
      aria-label="Sin resultados"
      className="lamina px-5 py-14 text-center md:py-20"
    >
      <span className="mx-auto flex size-14 items-center justify-center rounded-md border border-linea bg-hoja">
        <SearchX aria-hidden className="size-6 text-tinta-suave" />
      </span>

      <h2 className="titulo-lamina mt-6 text-[clamp(1.6rem,3.5vw,2.25rem)]">
        ¿No la encuentras?
      </h2>
      <p className="mx-auto mt-4 max-w-[60ch] text-[15px] leading-relaxed text-tinta-suave">
        Tenemos más de 42,000 piezas nuevas y también las conseguimos sobre
        pedido. Mándanos lo que buscas tal cual lo conoces y la localizamos
        contigo.
      </p>

      <div className="mx-auto mt-8 flex max-w-xs flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-center">
        <a
          href={urlWhatsApp(PRELLENADOS.sinResultados(termino))}
          target="_blank"
          rel="noopener noreferrer"
          className="rotulo-tecnico inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-whatsapp px-6 text-sm text-plano-hondo transition-[filter] duration-150 hover:brightness-95 active:brightness-90"
        >
          <IconWhatsApp lado={18} />
          Búscala por WhatsApp
        </a>
        <BotonCotizar
          mensaje={`Hola, busqué "${termino}" en el catálogo y no aparece. ¿La pueden conseguir?`}
          className="min-h-12 px-6"
        >
          Pregúntale a Vico
        </BotonCotizar>
      </div>

      <p className="mt-5 text-[13px] text-tinta-suave">
        Vico te cotiza al momento, 24/7, con IVA incluido
      </p>
    </section>
  );
}
