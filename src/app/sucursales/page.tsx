import type { Metadata } from "next";
import { NEGOCIO, PRELLENADOS, urlWhatsApp } from "@/config/negocio";
import { IconWhatsApp } from "@/components/IconWhatsApp";
import { QrWhatsApp } from "@/components/QrWhatsApp";
import { EncabezadoPagina } from "@/components/EncabezadoPagina";
import { TarjetaSucursal } from "@/components/TarjetaSucursal";
import { TituloSeccion } from "@/components/TituloSeccion";

// Sucursales con los datos de src/config/negocio.ts TAL CUAL (están marcados
// PENDIENTE de confirmación ahí: aquí no se agrega ni se inventa nada).

export const metadata: Metadata = {
  title: { absolute: "Sucursales en Monterrey | Autopartes Vidaurri" },
  description:
    "Dos sucursales en Monterrey para recoger tu refacción de colisión el mismo día: direcciones, horarios, teléfono y cómo llegar. Cotiza primero por chat o WhatsApp y pasa por tu pieza.",
  alternates: { canonical: "/sucursales" },
};

const PASOS = [
  {
    titulo: "Cotiza por chat o WhatsApp",
    texto: "Mándanos qué pieza ocupas y de qué auto es.",
  },
  {
    titulo: "Confirmamos precio y disponibilidad",
    texto: "Te decimos el precio con IVA incluido y si está lista para entrega.",
  },
  {
    titulo: "Recoge en sucursal o te la enviamos",
    texto: "Pasa por tu pieza a la sucursal que te quede o acordamos el envío.",
  },
] as const;

export default function PaginaSucursales() {
  return (
    <>
      <EncabezadoPagina
        rotulo="Dónde estamos"
        titulo="Recoge tu pieza hoy en Monterrey"
        descripcion="Cotiza primero por chat o WhatsApp y pasa por tu refacción a la sucursal que te quede más cerca."
        migas={[{ nombre: "Inicio", href: "/" }, { nombre: "Sucursales" }]}
      />

      <section className="bg-fondo">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <div className="grid gap-3 md:grid-cols-2 md:gap-4">
            {NEGOCIO.sucursales.map((s, i) => (
              <TarjetaSucursal key={s.nombre} sucursal={s} indice={i} como="h2" />
            ))}
          </div>
        </div>
      </section>

      {/* El camino completo en tres pasos + el CTA de conversación. */}
      <section className="trama-rejilla border-t border-borde bg-superficie">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-14 md:flex-row md:items-start md:py-20">
          <div className="flex-1">
            <TituloSeccion rotulo="Cómo funciona" titulo="Así de fácil" />
            <ol className="mt-8 space-y-6">
              {PASOS.map((paso, i) => (
                <li key={paso.titulo} className="flex items-start gap-4">
                  <span
                    aria-hidden
                    className="titulo-cartel num-tab w-12 shrink-0 text-4xl text-tinta/20"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="titulo-display text-lg">{paso.titulo}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-tinta-suave">
                      {paso.texto}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-9">
              <a
                href={urlWhatsApp(PRELLENADOS.generico)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-whatsapp px-6 py-3.5 font-display text-sm font-bold uppercase tracking-wide text-white transition-opacity duration-150 hover:opacity-90"
              >
                <IconWhatsApp lado={18} />
                Cotizar por WhatsApp
              </a>
              <p className="mt-3 text-xs text-tinta-suave">
                Respondemos en minutos en horario hábil.
              </p>
            </div>
          </div>

          {/* QR solo desktop: en móvil ya está el botón wa.me directo. */}
          <div className="hidden md:block md:w-64 md:shrink-0">
            <QrWhatsApp
              texto={PRELLENADOS.generico}
              leyenda="Escanéalo con tu cámara y cotiza por WhatsApp"
            />
          </div>
        </div>
      </section>
    </>
  );
}
