import { Phone } from "lucide-react";
import { BotonCotizar } from "@/components/BotonCotizar";
import { IconWhatsApp } from "@/components/IconWhatsApp";
import { QrWhatsApp } from "@/components/QrWhatsApp";
import { NEGOCIO, PRELLENADOS, urlWhatsApp } from "@/config/negocio";

// La forma rápida de pedir precio. Es un SERVICIO del mostrador, no el producto
// de la casa: por eso dejó de ser el bloque oscuro protagonista de la home (ese
// lugar lo ocupa ahora la sección de las dos puertas) y vive en una banda de
// papel hondo, delgada y comercial. Menos escenografía, más teléfono.
//
// Jerarquía de acción del sitio: 1º WhatsApp (verde), 2º chat de Vico (ámbar),
// 3º llamar. A la derecha, solo en desktop, el QR de WhatsApp: en móvil nadie
// escanea con su propio teléfono, ahí manda el botón wa.me.

// `text-plano-hondo` explícito sobre el ámbar: el texto encima del ámbar siempre
// va oscuro, en reposo y en pressed.
const CLASE_CHAT = "min-h-11 px-5 text-plano-hondo hover:text-plano-hondo";

export function FranjaAsistente() {
  return (
    <section
      aria-labelledby="asistente-titulo"
      className="border-y border-linea bg-papel-hondo"
    >
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <div className="md:flex md:items-center md:justify-between md:gap-12">
          <div className="max-w-2xl">
            <h2
              id="asistente-titulo"
              className="rotulo-tecnico text-[clamp(1.3rem,3vw,1.75rem)] text-tinta"
            >
              Dinos qué se rompió y te lo cotizamos
            </h2>
            <p className="mt-2.5 max-w-[68ch] text-[15px] leading-relaxed text-tinta-suave">
              {NEGOCIO.asistente} busca en el catálogo real de la tienda y te pasa
              el precio con IVA incluido a cualquier hora. Si prefieres tratar con
              una persona, te pasa con el mostrador.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <a
                href={urlWhatsApp(PRELLENADOS.generico)}
                target="_blank"
                rel="noopener noreferrer"
                className="rotulo-tecnico inline-flex min-h-11 items-center gap-2 rounded-md bg-whatsapp px-5 text-sm text-plano-hondo transition-[filter] duration-150 hover:brightness-95 active:brightness-90"
              >
                <IconWhatsApp lado={18} />
                Cotiza por WhatsApp
              </a>
              <BotonCotizar
                mensaje="Hola, quiero cotizar una pieza. Mi auto es: "
                className={CLASE_CHAT}
              >
                Cotizar por chat
              </BotonCotizar>
              <a
                href={`tel:${NEGOCIO.telefono}`}
                aria-label={`Llamar a ${NEGOCIO.nombre} al ${NEGOCIO.telefonoBonito}`}
                className="inline-flex min-h-11 items-center gap-2 px-1 text-[14px] text-tinta underline-offset-4 hover:underline"
              >
                <Phone aria-hidden className="size-4 shrink-0 text-tinta-suave" />
                <span className="num-tab font-mono">{NEGOCIO.telefonoBonito}</span>
              </a>
            </div>

            <p className="mt-3 max-w-[60ch] text-[12.5px] leading-snug text-tinta-suave">
              {NEGOCIO.asistente} contesta al momento, todos los días. Lo que te
              cotiza ya lleva IVA incluido.
            </p>
          </div>

          {/* QR solo desktop. `lamina` va aquí porque el QR se dibuja sobre su
              propia superficie blanca, no sobre el papel hondo de la banda. */}
          <QrWhatsApp
            texto={PRELLENADOS.generico}
            lado={112}
            leyenda="Escanéalo y cotiza por WhatsApp"
            className="lamina hidden md:block md:w-52 md:shrink-0"
          />
        </div>
      </div>
    </section>
  );
}
