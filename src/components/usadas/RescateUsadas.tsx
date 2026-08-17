import { MessagesSquare } from "lucide-react";
import { NEGOCIO, urlWhatsApp } from "@/config/negocio";
import { BotonCotizar } from "@/components/BotonCotizar";
import { IconWhatsApp } from "@/components/IconWhatsApp";

// Rescate conversacional de la Bodega Usado: cero resultados o base remota
// caida NUNCA son callejon sin salida — siempre WhatsApp (1º) y chat (2º)
// con el contexto de lo buscado ya precargado.

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
    <div className="carta trama-rejilla p-7 text-center md:p-10">
      <span className="mx-auto flex size-14 items-center justify-center rounded-xl border border-borde bg-fondo">
        <MessagesSquare aria-hidden className="size-6 text-tinta-suave" />
      </span>

      <h2 className="titulo-cartel mt-5 text-[clamp(1.4rem,3vw,2rem)]">
        {titulo}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-tinta-suave">
        {descripcion}
      </p>

      <div className="mx-auto mt-7 flex w-full max-w-sm flex-col gap-2.5">
        <a
          href={urlWhatsApp(textoWhatsApp)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg bg-whatsapp px-4 py-3.5 font-display text-sm font-bold uppercase tracking-wide text-white transition-opacity duration-150 hover:opacity-90"
        >
          <IconWhatsApp lado={18} />
          Pregunta por WhatsApp
        </a>
        <p className="text-xs text-tinta-suave">
          Respondemos en minutos en horario hábil.
        </p>

        <BotonCotizar mensaje={mensajeChat} className="mt-1 w-full">
          Pregúntale a {NEGOCIO.asistente}
        </BotonCotizar>
        <p className="text-xs text-tinta-suave">El asistente cotiza 24/7.</p>
      </div>
    </div>
  );
}
