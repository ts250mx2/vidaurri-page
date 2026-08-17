import type { Metadata, Viewport } from "next";
import { Montserrat, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BarraMovil } from "@/components/BarraMovil";
import { ChatVico } from "@/components/ChatVico";
import { DefsMetal } from "@/components/DefsMetal";
import { NEGOCIO, urlSitio } from "@/config/negocio";

// Tipografía de la vitrina: Montserrat en pesos altos rotula los titulares y la
// navegación —geométrica y ancha, con la contundencia de un letrero de fachada,
// como pidió la referencia del cliente; la condensada estrecha que había antes
// se leía técnica, no comercial. Geist sostiene el cuerpo porque se lee al sol
// en un teléfono de gama media, y Geist Mono queda para lo que de verdad es
// medida: números de parte, precios y cotas.

const montserrat = Montserrat({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(urlSitio()),
  title: {
    default:
      "Autopartes Vidaurri — Refacciones de colisión nuevas y usadas en Monterrey",
    template: "%s · Autopartes Vidaurri",
  },
  description:
    "Más de 41,000 refacciones de colisión nuevas y 17,000 usadas con fotos reales. Cofres, facias, faros, calaveras y más. Cotiza con IVA incluido, por chat o WhatsApp. Más de 40 años en Monterrey.",
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: NEGOCIO.nombre,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // El carbón de la vitrina, no el azul del mundo anterior: la barra del
  // navegador móvil es una superficie más del diseño.
  themeColor: "#111116",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body
        className={`${montserrat.variable} ${geistSans.variable} ${geistMono.variable} bg-papel font-sans text-tinta antialiased`}
      >
        {/*
          THESIS: La refaccionaria de colisión como vitrina nocturna: el metal se
          exhibe en penumbra y lo único encendido es la mercancía con su precio.
          Refuse: la parrilla uniforme de tarjetas que ordena autopartes como
          abarrotes, y el azul corporativo del ramo.
          OWN-WORLD: Campo carbón (#111116/#1c1c22) con la foto real del catálogo
          fundida al fondo. El ORO de la casa (#d4af37) es la identidad: filo
          metálico, iconos, marco del énfasis y la acción. La mercancía vive en
          lámina clara sobre papel, con sello de goma para la existencia y tinta
          roja de anotación para la pieza única. Archivo Narrow rotula en caja
          alta. Nunca oro en el texto: el degradado tipográfico es un truco.
          STORY: Entiende que aquí está la pieza exacta de su golpe con precio con
          IVA; cree porque ve mercancía real, sellada en existencia, de una bodega
          de 40 años; actúa buscando su vehículo o cotizando por WhatsApp.
          FIRST VIEWPORT: Vitrina en carbón. Izquierda, el titular con "tu pieza"
          enmarcada en oro. Centro, las tres señales de la casa con iconos de oro.
          Derecha, el buscador 2×2 en panel de cristal con el botón de oro —la
          acción— y bajo él la tarjeta de Vico. Al pie, los tipos más buscados.
          FORM: Vitrina nocturna sobre el despiece; dirección fijada por el
          cliente con imagen de referencia, que manda sobre el reparto; seed
          ff9c5a34.
          FINISH: unreviewed and undocumented is unfinished; this build ends with
          the finish review, the verdict, DESIGN.md, and every shipping raster
          carrying its provenance.
        */}
        <DefsMetal />
        <Header />
        {/* pb en móvil: espacio para la barra fija inferior */}
        <main className="pb-24 md:pb-0">{children}</main>
        <Footer />
        <BarraMovil />
        <ChatVico />
      </body>
    </html>
  );
}
