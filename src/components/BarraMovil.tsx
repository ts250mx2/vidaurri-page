"use client";

import { Phone, MessageSquareText } from "lucide-react";
import { IconWhatsApp } from "@/components/IconWhatsApp";
import { abrirChat } from "@/components/BotonCotizar";
import { NEGOCIO, urlWhatsApp, PRELLENADOS } from "@/config/negocio";

// Barra fija inferior en movil (todo el sitio): la conversion ES la
// conversacion y nunca debe estar a mas de un tap. WhatsApp al centro,
// dominante. En desktop no existe (ahi viven el widget de chat y los QR).

const CLASE_LATERAL =
  "flex flex-col items-center justify-center gap-1 rounded-xl border border-borde bg-fondo py-2.5 font-display text-[11px] font-bold uppercase tracking-[0.06em] text-tinta transition-colors duration-150 active:bg-borde";

export function BarraMovil() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-borde bg-superficie px-3 pt-2.5 shadow-[0_-6px_20px_rgb(13_16_21/0.08)] md:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
    >
      <div className="grid grid-cols-[1fr_1.5fr_1fr] gap-2">
        <a href={`tel:${NEGOCIO.telefono}`} className={CLASE_LATERAL}>
          <Phone aria-hidden className="size-4" />
          Llamar
        </a>
        <a
          href={urlWhatsApp(PRELLENADOS.generico)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-1 rounded-xl bg-whatsapp py-2.5 font-display text-xs font-bold uppercase tracking-wide text-white transition-opacity duration-150 active:opacity-90"
        >
          <IconWhatsApp lado={19} />
          WhatsApp
        </a>
        <button type="button" onClick={() => abrirChat()} className={CLASE_LATERAL}>
          <MessageSquareText aria-hidden className="size-4" />
          Chat
        </button>
      </div>
    </div>
  );
}
