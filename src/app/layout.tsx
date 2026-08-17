import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BarraMovil } from "@/components/BarraMovil";
import { ChatVico } from "@/components/ChatVico";
import { NEGOCIO, urlSitio } from "@/config/negocio";

// Tipografia de la direccion "Mostrador": Barlow Condensed para display
// (señalizacion de taller) y Geist para cuerpo — la misma familia del sistema
// interno de Vidaurri, el puente de identidad entre ambos.

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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
    "Más de 42,000 refacciones de colisión nuevas y 19,000 usadas con fotos reales. Cofres, facias, faros, calaveras y más. Cotiza en minutos con IVA incluido, por chat o WhatsApp. Más de 40 años en Monterrey.",
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: NEGOCIO.nombre,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#171b21",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body
        className={`${barlow.variable} ${geistSans.variable} ${geistMono.variable} bg-fondo font-sans text-tinta antialiased`}
      >
        <Header />
        {/* pb en movil: espacio para la barra fija inferior */}
        <main className="pb-24 md:pb-0">{children}</main>
        <Footer />
        <BarraMovil />
        <ChatVico />
      </body>
    </html>
  );
}
