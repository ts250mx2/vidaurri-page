import type { Metadata } from "next";
import { NEGOCIO } from "@/config/negocio";

// Aviso de privacidad conforme a la LFPDPPP, genérico y honesto: solo lo que
// la página realmente recaba (nombre, teléfono y mensajes del chat/WhatsApp)
// y para qué se usa (cotizar y dar seguimiento). Sin promesas inventadas.
//
// Va como una hoja sobre el papel: lámina blanca, medida de lectura corta y
// más aire ARRIBA de cada apartado que abajo, para que el ojo agrupe el
// título con su párrafo.

export const metadata: Metadata = {
  title: "Aviso de privacidad",
  description:
    "Aviso de privacidad de Autopartes Vidaurri: qué datos recabamos cuando nos escribes por chat o WhatsApp, para qué los usamos y cómo ejercer tus derechos ARCO.",
  alternates: { canonical: "/aviso-de-privacidad" },
  robots: { index: true, follow: true },
};

const CLASE_H2 = "rotulo-tecnico mt-10 text-lg text-tinta";
const CLASE_P = "mt-2.5 text-[15px] leading-relaxed";

export default function PaginaAvisoDePrivacidad() {
  return (
    <section className="bg-papel">
      <div className="mx-auto max-w-[72ch] px-4 pb-16 pt-10 md:pt-14">
        <article className="lamina px-5 py-9 md:px-10 md:py-12">
          <h1 className="titulo-lamina text-[clamp(2rem,5vw,3rem)]">
            Aviso de privacidad
          </h1>
          <p className={`${CLASE_P} mt-5 text-tinta-suave`}>
            Este aviso se emite en cumplimiento de la Ley Federal de Protección
            de Datos Personales en Posesión de los Particulares (LFPDPPP) y
            aplica a los datos que nos compartes al usar esta página.
          </p>

          <h2 className={CLASE_H2}>Responsable</h2>
          <p className={CLASE_P}>
            {NEGOCIO.razonSocial} es la responsable del tratamiento de tus datos
            personales, con domicilio en sus sucursales de {NEGOCIO.ciudad}:
          </p>
          <ul className="mt-3 divide-y divide-linea border-y border-linea text-[15px] leading-relaxed">
            {NEGOCIO.sucursales.map((s) => (
              <li key={s.nombre} className="py-3">
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

          <p className="mt-12 border-t border-linea pt-5 text-xs text-tinta-suave">
            Documento en revisión — versión preliminar.
          </p>
        </article>
      </div>
    </section>
  );
}
