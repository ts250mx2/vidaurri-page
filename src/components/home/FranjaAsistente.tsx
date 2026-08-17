import { BotonCotizar } from "@/components/BotonCotizar";
import { IconWhatsApp } from "@/components/IconWhatsApp";
import { QrWhatsApp } from "@/components/QrWhatsApp";
import { NEGOCIO, PRELLENADOS, urlWhatsApp } from "@/config/negocio";

// Franja del asistente: la ÚNICA banda grafito de la home después del hero,
// enmarcada en ámbar. Es un servicio del mostrador —la forma rápida de pedir
// precio— no el producto de la casa: por eso va baja, con titular mediano y sin
// escenografía. A la derecha, solo en desktop, el QR de WhatsApp (en móvil ya
// está el botón wa.me directo, que es lo que ahí sirve).

export function FranjaAsistente() {
  return (
    <section
      aria-labelledby="asistente-titulo"
      className="sobre-grafito relative isolate overflow-hidden border-y-4 border-ambar bg-grafito-hondo text-white"
    >
      <span
        aria-hidden
        className="trama-rejilla-oscura absolute inset-0 opacity-70"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-7 px-4 py-10 md:flex-row md:items-center md:justify-between md:gap-10 md:py-12">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2.5">
            <span aria-hidden className="h-px w-7 shrink-0 bg-white/35" />
            <span className="rotulo text-white/60">
              {NEGOCIO.asistente} · el asistente de la casa
            </span>
          </p>
          <h2
            id="asistente-titulo"
            className="titulo-cartel mt-2 text-[clamp(1.5rem,3.4vw,2.1rem)] text-white"
          >
            Mándanos lo que chocaste y te lo cotizamos al momento
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-300">
            {NEGOCIO.asistente} busca en el catálogo real de la tienda y te pasa el
            precio con IVA incluido a cualquier hora, todos los días.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <BotonCotizar
              mensaje="Hola, quiero cotizar una pieza. Mi auto es: "
              className="px-5 py-3"
            >
              Cotizar por chat
            </BotonCotizar>
            <a
              href={urlWhatsApp(PRELLENADOS.generico)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-whatsapp px-5 py-3 font-display text-sm font-bold uppercase tracking-wide text-white transition-opacity duration-150 hover:opacity-90"
            >
              <IconWhatsApp lado={18} />
              Cotizar por WhatsApp
            </a>
          </div>
          <p className="mt-3 text-xs text-slate-400">El asistente cotiza 24/7.</p>
        </div>

        {/* QR solo desktop (regla del sitio): en móvil nadie escanea con su
            propio teléfono, ahí manda el botón wa.me de arriba. */}
        <div className="hidden md:block md:w-52 md:shrink-0">
          <QrWhatsApp
            texto={PRELLENADOS.generico}
            lado={112}
            leyenda="Escanéalo y cotiza por WhatsApp"
          />
        </div>
      </div>
    </section>
  );
}
