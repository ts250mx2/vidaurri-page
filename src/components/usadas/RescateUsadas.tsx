import { MessagesSquare } from "lucide-react";
import { NEGOCIO, urlWhatsApp } from "@/config/negocio";
import { BotonCotizar } from "@/components/BotonCotizar";
import { IconWhatsApp } from "@/components/IconWhatsApp";

// Rescate conversacional de la bodega de usado: cero resultados o base remota
// caída NUNCA son callejón sin salida — siempre WhatsApp (1º) y chat (2º) con
// el contexto de lo buscado ya precargado, y bajo cada uno lo que se puede
// esperar de verdad.

export function RescateUsadas({
  titulo,
  descripcion,
  textoWhatsApp,
  mensajeChat,
}: {
  titulo: string;
  descripcion: string;
  /** Mensaje prellenado del enlace wa.me (incluir lo buscado o el código). */
  textoWhatsApp: string;
  /** Mensaje que se precarga en el chat de Vico. */
  mensajeChat: string;
}) {
  return (
    <div className="lamina p-7 text-center md:p-12">
      <span className="mx-auto flex size-14 items-center justify-center rounded-md border border-linea bg-hoja">
        <MessagesSquare aria-hidden className="size-6 text-tinta-suave" />
      </span>

      <h2 className="titulo-lamina mt-6 text-[clamp(1.4rem,3vw,2rem)]">{titulo}</h2>
      <p className="mx-auto mt-4 max-w-[58ch] text-[15px] leading-relaxed text-tinta-suave">
        {descripcion}
      </p>

      <div className="mx-auto mt-8 flex w-full max-w-sm flex-col gap-2.5">
        <a
          href={urlWhatsApp(textoWhatsApp)}
          target="_blank"
          rel="noopener noreferrer"
          className="rotulo-tecnico flex min-h-12 items-center justify-center gap-2 rounded-md bg-whatsapp px-4 text-sm text-plano-hondo transition-[filter] duration-150 hover:brightness-95 active:brightness-90"
        >
          <IconWhatsApp lado={18} />
          Pregunta por WhatsApp
        </a>
        <p className="text-xs text-tinta-suave">
          Vico te cotiza al momento, 24/7.
        </p>

        <BotonCotizar mensaje={mensajeChat} className="mt-1 min-h-12 w-full">
          Pregúntale a {NEGOCIO.asistente}
        </BotonCotizar>
        <p className="text-xs text-tinta-suave">El asistente cotiza 24/7.</p>
      </div>
    </div>
  );
}
