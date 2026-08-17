import QRCode from "qrcode";
import clsx from "clsx";
import { IconWhatsApp } from "@/components/IconWhatsApp";
import { NEGOCIO, urlWhatsApp } from "@/config/negocio";

// QR de WhatsApp generado por página con texto prellenado (el código de pieza
// cuando existe). SOLO desktop: en móvil nadie escanea con su propio teléfono,
// ahí va el botón directo wa.me. El padre decide la visibilidad (hidden md:block).
//
// El código se dibuja en tinta de plano sobre lámina blanca: el contraste es
// requisito de lectura de la cámara, no una preferencia estética.

/** Tinta del trazo del QR. Espejo de --color-tinta (qrcode.js pide hex). */
const TINTA_QR = "#0f2233";

export async function QrWhatsApp({
  texto,
  leyenda = "Escanéalo con tu cámara y cotiza por WhatsApp",
  lado = 128,
  className,
}: {
  /** Texto prellenado del mensaje (incluir el código de pieza cuando exista). */
  texto?: string;
  leyenda?: string;
  lado?: number;
  className?: string;
}) {
  const url = urlWhatsApp(texto);
  const svg = await QRCode.toString(url, {
    type: "svg",
    margin: 1,
    width: lado,
    color: { dark: TINTA_QR, light: "#ffffff" },
  });

  return (
    <div className={clsx("lamina p-5 text-center", className)}>
      <div
        aria-hidden
        className="mx-auto"
        style={{ width: lado, height: lado }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="mx-auto mt-3.5 max-w-[24ch] border-t border-linea pt-3.5 text-xs leading-snug text-tinta-suave">
        {leyenda}
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="num-tab mt-2.5 inline-flex min-h-11 items-center gap-1.5 font-mono text-xs font-semibold text-tinta underline-offset-4 hover:underline"
      >
        <span className="flex size-5 shrink-0 items-center justify-center rounded-sm bg-whatsapp text-plano-hondo">
          <IconWhatsApp lado={13} />
        </span>
        {NEGOCIO.whatsappBonito}
      </a>
    </div>
  );
}
