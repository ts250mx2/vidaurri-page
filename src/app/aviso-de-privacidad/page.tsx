import type { Metadata } from "next";
import { NEGOCIO } from "@/config/negocio";

// Aviso de privacidad conforme a la LFPDPPP, genérico y honesto: solo lo que
// la página realmente recaba (nombre, teléfono y mensajes del chat/WhatsApp)
// y para qué se usa (cotizar y dar seguimiento). Sin promesas inventadas.

export const metadata: Metadata = {
  title: "Aviso de privacidad",
  description:
    "Aviso de privacidad de Autopartes Vidaurri: qué datos recabamos cuando nos escribes por chat o WhatsApp, para qué los usamos y cómo ejercer tus derechos ARCO.",
  alternates: { canonical: "/aviso-de-privacidad" },
  robots: { index: true, follow: true },
};

const CLASE_H2 = "mt-8 font-display text-xl font-bold uppercase tracking-wide";
const CLASE_P = "mt-2 text-[15px] leading-relaxed";

export default function PaginaAvisoDePrivacidad() {
  return (
    <section className="bg-fondo">
      <div className="mx-auto max-w-3xl px-4 pb-14 pt-12 md:pt-16">
        <h1 className="titulo-display text-4xl sm:text-5xl">
          Aviso de privacidad
        </h1>
        <p className={`${CLASE_P} mt-4 text-tinta-suave`}>
          Este aviso se emite en cumplimiento de la Ley Federal de Protección
          de Datos Personales en Posesión de los Particulares (LFPDPPP) y
          aplica a los datos que nos compartes al usar esta página.
        </p>

        <h2 className={CLASE_H2}>Responsable</h2>
        <p className={CLASE_P}>
          {NEGOCIO.razonSocial} es la responsable del tratamiento de tus datos
          personales, con domicilio en sus sucursales de {NEGOCIO.ciudad}:
        </p>
        <ul className="mt-2 space-y-1 text-[15px] leading-relaxed">
          {NEGOCIO.sucursales.map((s) => (
            <li key={s.nombre}>
              <span className="font-semibold">{s.nombre}:</span> {s.direccion}
            </li>
          ))}
        </ul>

        <h2 className={CLASE_H2}>Qué datos recabamos</h2>
        <p className={CLASE_P}>
          Cuando nos escribes por el chat de la página o por WhatsApp recabamos
          tu nombre, tu número de teléfono y el contenido de tus mensajes (por
          ejemplo, la pieza que buscas y los datos de tu vehículo). No te
          pedimos más datos de los necesarios para atenderte.
        </p>

        <h2 className={CLASE_H2}>Para qué los usamos</h2>
        <p className={CLASE_P}>
          Usamos tus datos únicamente para cotizarte las piezas que nos pides,
          responder tus dudas y dar seguimiento a tus pedidos y aclaraciones.
        </p>

        <h2 className={CLASE_H2}>Con quién los compartimos</h2>
        <p className={CLASE_P}>
          No vendemos ni cedemos tus datos personales. Solo los compartiríamos
          cuando una autoridad competente lo requiera conforme a la ley.
        </p>

        <h2 className={CLASE_H2}>Tus derechos ARCO</h2>
        <p className={CLASE_P}>
          Puedes ejercer tus derechos de acceso, rectificación, cancelación y
          oposición (derechos ARCO) presentando tu solicitud por escrito en
          cualquiera de nuestras sucursales, acompañada de una identificación
          oficial. Te responderemos en los plazos que marca la LFPDPPP.
        </p>

        <h2 className={CLASE_H2}>Cambios a este aviso</h2>
        <p className={CLASE_P}>
          Cualquier cambio a este aviso se publicará en esta misma página.
        </p>

        <p className="mt-10 text-xs text-tinta-suave">
          Documento en revisión — versión preliminar.
        </p>
      </div>
    </section>
  );
}
