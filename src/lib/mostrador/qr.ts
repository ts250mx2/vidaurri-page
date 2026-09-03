import QRCode from "qrcode";

// QR de la hoja de pedido: la liga al pedido en el mostrador para que el
// almacenista lo abra desde el celular sin teclear el folio. SOLO SERVIDOR:
// `qrcode` genera el SVG en Node y el markup viaja ya listo al componente
// (y al PDF), así que ningún cliente carga la librería.
//
// Nivel M (15 % de corrección): el papel se dobla y se mancha en el anaquel;
// margen de 1 módulo porque el QR ya va sobre lámina blanca con aire propio.

export interface OpcionesQr {
  /** Lado del QR en px (default 110). */
  ancho?: number;
}

const ANCHO_QR = 110;

/** SVG inline del QR con `texto` (normalmente una URL absoluta). */
export async function svgQr(texto: string, opciones: OpcionesQr = {}): Promise<string> {
  const { ancho = ANCHO_QR } = opciones;
  if (!texto) throw new Error("QR: el texto está vacío");
  return QRCode.toString(texto, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    width: ancho,
    // Negro puro: en impresión sale igual que en pantalla y la cámara lo lee
    // sin depender del tono de la tinta del sitio.
    color: { dark: "#000000", light: "#ffffff" },
  });
}
