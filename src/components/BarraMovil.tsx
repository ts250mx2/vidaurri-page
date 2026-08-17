"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Phone, MessageSquareText } from "lucide-react";
import { IconWhatsApp } from "@/components/IconWhatsApp";
import { abrirChat } from "@/components/BotonCotizar";
import { NEGOCIO, urlWhatsApp, PRELLENADOS } from "@/config/negocio";

// Pie fijo de móvil (todo el sitio), en DOS PISOS, como el header:
//
// 1. LA CINTA DE MAYOREO, sobre campo carbón. El negocio atiende a dos
//    audiencias del mismo peso —el que chocó su carro y el taller que vive de
//    repararlos— y en el teléfono la segunda solo existía enterrada en el menú
//    hamburguesa, con el bloque B2B a media hora de scroll. Aquí la puerta de
//    mayoreo queda a un tap desde cualquier página, sin robarle un solo píxel
//    a la conversión: es carbón con la palabra en oro, no compite con el verde.
// 2. LA FILA DE CONVERSIÓN, sin tocar: la conversión ES la conversación y
//    nunca debe estar a más de un tap. Lámina blanca apoyada sobre el papel,
//    no tarjeta oscura: al sol lo que se lee es el contraste del blanco.
//    WhatsApp al centro y dominante por ancho; llamar y chat a los lados en
//    tinta. En desktop no existe (ahí viven el lanzador del chat y los QR).
//
// El espaciador de abajo es parte del mecanismo: el pie es `fixed` y sin él se
// come el último renglón del cajetín. Va deliberadamente un paso MÁS CORTO que
// la barra —si sobrara, asomaría una banda de papel bajo el footer oscuro; si
// falta, solo se come respiro sobrante del footer, no texto.

const CLASE_LATERAL =
  "flex min-h-11 flex-col items-center justify-center gap-1 rounded-md border border-linea bg-papel py-2 rotulo-tecnico text-[12px] text-tinta transition-colors duration-150 active:bg-papel-hondo";

const ALTO_RESERVADO = "calc(env(safe-area-inset-bottom, 0px) + 6.5rem)";

export function BarraMovil() {
  const ruta = usePathname();
  const enMayoreo = ruta === "/mayoreo" || ruta.startsWith("/mayoreo/");

  return (
    <>
      <div aria-hidden className="md:hidden" style={{ height: ALTO_RESERVADO }} />

      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-linea bg-hoja shadow-[0_-6px_20px_rgb(10_24_38/0.10)] md:hidden"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
      >
        {/* Sobre campo carbón el foco se dibuja en oro, no en tinta roja. */}
        <div className="sobre-plano">
          <Link
            href="/mayoreo"
            aria-current={enMayoreo ? "page" : undefined}
            className="flex min-h-11 items-center gap-2.5 bg-plano px-4 transition-colors duration-150 active:bg-plano-claro"
          >
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-white/75">
              ¿Tienes taller o refaccionaria?
            </span>
            <span className="rotulo-tecnico shrink-0 text-[12.5px] text-ambar">
              Mayoreo
            </span>
            <ChevronRight aria-hidden className="size-4 shrink-0 text-ambar" />
          </Link>
        </div>

        <nav
          aria-label="Contacto rápido"
          className="grid grid-cols-[1fr_1.5fr_1fr] gap-2 px-3 pt-2.5"
        >
          <a href={`tel:${NEGOCIO.telefono}`} className={CLASE_LATERAL}>
            <Phone aria-hidden className="size-4" />
            Llamar
          </a>
          <a
            href={urlWhatsApp(PRELLENADOS.generico)}
            target="_blank"
            rel="noopener noreferrer"
            className="rotulo-tecnico flex min-h-11 flex-col items-center justify-center gap-1 rounded-md bg-whatsapp py-2 text-[12px] text-plano-hondo transition-[filter] duration-150 active:brightness-95"
          >
            <IconWhatsApp lado={19} />
            WhatsApp
          </a>
          <button
            type="button"
            onClick={() => abrirChat()}
            className={CLASE_LATERAL}
          >
            <MessageSquareText aria-hidden className="size-4" />
            Chat
          </button>
        </nav>
      </div>
    </>
  );
}
