import type { Metadata } from "next";
import { NEGOCIO, PRELLENADOS, urlWhatsApp } from "@/config/negocio";
import { IconWhatsApp } from "@/components/IconWhatsApp";
import { QrWhatsApp } from "@/components/QrWhatsApp";
import { EncabezadoPagina } from "@/components/EncabezadoPagina";
import { TarjetaSucursal } from "@/components/TarjetaSucursal";
import { TituloSeccion } from "@/components/TituloSeccion";

// Sucursales con los datos de src/config/negocio.ts TAL CUAL (están marcados
// PENDIENTE de confirmación ahí: aquí no se agrega ni se inventa nada).
//
// Sin numerales 01/02/03 en ninguna parte: el orden de las sucursales no es
// información, y los pasos se leen en orden por su sitio en la lista.

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
        titulo="Recoge tu pieza hoy en Monterrey"
        descripcion="Cotiza primero por chat o WhatsApp y pasa por tu refacción a la sucursal que te quede más cerca."
        migas={[{ nombre: "Inicio", href: "/" }, { nombre: "Sucursales" }]}
      />

      <section className="bg-papel">
        <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
          <div className="grid gap-3 md:grid-cols-2 md:gap-4">
            {NEGOCIO.sucursales.map((s) => (
              <TarjetaSucursal key={s.nombre} sucursal={s} como="h2" />
            ))}
          </div>
        </div>
      </section>

      {/* El camino completo, en orden, + el CTA de conversación. */}
      <section className="border-t border-linea bg-hoja">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-14 md:flex-row md:items-start md:py-20">
          <div className="flex-1">
            <TituloSeccion titulo="Así de fácil" />

            <ol className="mt-8 max-w-[68ch] divide-y divide-linea border-b border-linea">
              {PASOS.map((paso) => (
                <li key={paso.titulo} className="py-5">
                  <h3 className="rotulo-tecnico text-lg leading-tight text-tinta">
                    {paso.titulo}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-tinta-suave">
                    {paso.texto}
                  </p>
                </li>
              ))}
            </ol>

            <div className="mt-9">
              <a
                href={urlWhatsApp(PRELLENADOS.generico)}
                target="_blank"
                rel="noopener noreferrer"
                className="rotulo-tecnico inline-flex min-h-12 items-center gap-2 rounded-md bg-whatsapp px-6 text-sm text-plano-hondo transition-[filter] duration-150 hover:brightness-95 active:brightness-90"
              >
                <IconWhatsApp lado={18} />
                Cotizar por WhatsApp
              </a>
              <p className="mt-3 text-xs text-tinta-suave">
                Vico te cotiza al momento, 24/7.
              </p>
            </div>
          </div>

          {/* QR solo en escritorio: en móvil ya está el botón wa.me directo. */}
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
