import QRCode from "qrcode";
import clsx from "clsx";
import { IconWhatsApp } from "@/components/IconWhatsApp";
import { NEGOCIO, urlWhatsApp } from "@/config/negocio";

// QR de WhatsApp generado por pagina con texto prellenado (el codigo de pieza
// cuando existe). SOLO desktop: en movil nadie escanea con su propio telefono,
// ahi va el boton directo wa.me. El padre decide la visibilidad (hidden md:block).

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
    color: { dark: "#171b21", light: "#ffffff" },
  });

  return (
    <div
      className={clsx("carta p-5 text-center", className)}
    >
      <div
        aria-hidden
        className="mx-auto"
        style={{ width: lado, height: lado }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="mx-auto mt-3.5 max-w-[24ch] border-t border-borde pt-3.5 text-xs leading-snug text-tinta-suave">
        {leyenda}
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="num-tab mt-2.5 inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-tinta underline-offset-4 hover:underline"
      >
        <span className="text-whatsapp">
          <IconWhatsApp lado={14} />
        </span>
        {NEGOCIO.whatsappBonito}
      </a>
    </div>
  );
}
