import { jsPDF } from "jspdf";
import autoTable, { type CellHookData } from "jspdf-autotable";
import QRCode from "qrcode";
import { NEGOCIO } from "@/config/negocio";
import { codificarCodigo128, ZONA_SILENCIO } from "./codigo128";
import { ETIQUETA_CANAL, ETIQUETA_ORIGEN, fechaHora, telefonoLegible } from "./etiquetas";
import { logoPng } from "./logo-png";
import { ETIQUETA_ESTATUS } from "./reglas";
import type { HojaSurtido, RenglonSurtido } from "./tipos";

// La hoja de pedido como PDF de verdad, armada en el servidor con jsPDF: la
// misma hoja de surtido que imprime el navegador (`surtido/page.tsx`), pero
// como archivo que se manda por WhatsApp o se archiva. SIN precios a
// propósito: aquí se surte, no se cobra. Lleva la misma cabecera —logo, folio,
// código de barras para el lector del POS y QR con la liga al pedido— y la
// misma tabla con la casilla vacía para palomear al surtir.
//
// Carta con márgenes de 15 mm y tipografías estándar del PDF (Helvetica y
// Courier): Barlow no va embebida para no engordar cada archivo con la fuente;
// el papel imita la lámina del sitio con tinta, línea y rótulos en mayúsculas.

/** Tinta de la lámina (`globals.css`): texto, metadato, hairline, urgencia. */
type Rgb = readonly [number, number, number];
const TINTA: Rgb = [22, 24, 29];
const TINTA_SUAVE: Rgb = [91, 98, 108];
const LINEA: Rgb = [211, 216, 222];
const ANOTACION: Rgb = [217, 45, 32];
const BLANCO: Rgb = [255, 255, 255];

/** Carta en mm. */
const ANCHO_PAGINA = 215.9;
const ALTO_PAGINA = 279.4;
const MARGEN = 15;
const ANCHO_UTIL = ANCHO_PAGINA - MARGEN * 2;
/** Espacio reservado abajo para el pie de página, desde el borde del papel. */
const ALTO_PIE = 22;

/** Cabecera: logo, QR y barras. */
const LADO_LOGO = 14;
const LADO_QR = 28;
/** Px del PNG del QR: 300 sobra para 28 mm y se lee con cualquier cámara. */
const PX_QR = 300;
const ALTO_BARRAS = 14;
/** Ancho máximo del código de barras; con folios cortos el módulo llega al tope. */
const ANCHO_MAX_BARRAS = 62;
/** Módulo de 0.33 mm (~13 mil): el mínimo cómodo para un lector de mano. */
const MODULO_MAX_MM = 0.33;
/** Aire entre el código de barras y el QR. */
const SEPARACION_IDENTIFICADORES = 6;

/** Cuerpos de letra en pt. */
const PT_ROTULO = 7;
const PT_CUERPO = 9;
const PT_FOLIO = 26;
const PT_MARCA = 13;
const PT_TABLA = 8.5;
const PT_CABECERA_TABLA = 7.5;
/** Interlineado de los valores de la ficha de datos, en mm. */
const INTERLINEA = 4.2;
/** Lado de la casilla de surtido en la tabla. */
const LADO_CASILLA = 4.5;
/** Columna de la casilla (0-based) y de la existencia en la tabla. */
const COLUMNA_EXISTENCIA = 5;
const COLUMNA_SURTIDO = 7;

function rgb(doc: jsPDF, color: Rgb): void {
  doc.setTextColor(color[0], color[1], color[2]);
}

function rotulo(doc: jsPDF, texto: string, x: number, y: number, opciones: { align?: "left" | "center" | "right" } = {}): void {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(PT_ROTULO);
  doc.setCharSpace(0.3);
  rgb(doc, TINTA_SUAVE);
  doc.text(texto.toUpperCase(), x, y, opciones);
  doc.setCharSpace(0);
}

function referencia(renglon: RenglonSurtido): string {
  if (renglon.codigo) return renglon.codigo;
  if (renglon.idPiezaUsada !== null) return `Usada #${renglon.idPiezaUsada}`;
  return "—";
}

/** 'AAAA-MM-DD HH:MM' de este instante en horario de Monterrey, para `fechaHora`. */
function ahoraMonterrey(): string {
  // sv-SE da "2026-09-03 10:31" tal cual, sin armar el formato a mano.
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Monterrey",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

/* ------------------------------------------------------------------ */
/* Cabecera                                                            */
/* ------------------------------------------------------------------ */

/** Marca: la V rasterizada (o nada) y el rótulo "Autopartes / Vidaurri" en texto. */
async function pintarMarca(doc: jsPDF, x: number, y: number): Promise<void> {
  const png = await logoPng();
  let xTexto = x;
  if (png) {
    doc.addImage(png.toString("base64"), "PNG", x, y, LADO_LOGO, LADO_LOGO);
    xTexto = x + LADO_LOGO + 3;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(PT_ROTULO);
  doc.setCharSpace(0.4);
  rgb(doc, TINTA_SUAVE);
  doc.text("AUTOPARTES", xTexto, y + 4.5);
  doc.setFontSize(PT_MARCA);
  doc.setCharSpace(0.3);
  rgb(doc, TINTA);
  doc.text("VIDAURRI", xTexto, y + 10.5);
  doc.setCharSpace(0);
}

/**
 * Código de barras del folio con rectángulos (jsPDF no traga el SVG): un
 * `rect` relleno por barra, zona de silencio a cada lado y el folio en Courier
 * debajo. Devuelve el ancho pintado para acomodar lo que va a su izquierda.
 */
function pintarBarras(doc: jsPDF, folio: string, xDerecha: number, y: number): number {
  const codigo = codificarCodigo128(folio);
  const modulos = codigo.anchoModulos + ZONA_SILENCIO * 2;
  const modulo = Math.min(MODULO_MAX_MM, ANCHO_MAX_BARRAS / modulos);
  const ancho = modulos * modulo;
  const xInicio = xDerecha - ancho;

  doc.setFillColor(TINTA[0], TINTA[1], TINTA[2]);
  let x = xInicio + ZONA_SILENCIO * modulo;
  for (const { ancho: anchoModulo, barra } of codigo.modulos) {
    const w = anchoModulo * modulo;
    if (barra) doc.rect(x, y, w, ALTO_BARRAS, "F");
    x += w;
  }

  doc.setFont("courier", "normal");
  doc.setFontSize(PT_CUERPO);
  doc.setCharSpace(0.5);
  rgb(doc, TINTA);
  doc.text(folio, xInicio + ancho / 2, y + ALTO_BARRAS + 4, { align: "center" });
  doc.setCharSpace(0);
  return ancho;
}

async function pintarQr(doc: jsPDF, url: string, x: number, y: number): Promise<void> {
  const png = await QRCode.toBuffer(url, {
    type: "png",
    margin: 1,
    width: PX_QR,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" },
  });
  doc.addImage(png.toString("base64"), "PNG", x, y, LADO_QR, LADO_QR);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(PT_ROTULO);
  rgb(doc, TINTA_SUAVE);
  doc.text("Escanea para ver el pedido", x + LADO_QR / 2, y + LADO_QR + 3.5, { align: "center" });
}

/**
 * Identificadores del lado derecho: QR pegado al margen y, si hay folio, las
 * barras a su izquierda. Cada uno degrada por separado y loguea: una hoja sin
 * QR sigue sirviendo para surtir.
 */
async function pintarIdentificadores(doc: jsPDF, hoja: HojaSurtido, urlPedido: string, y: number): Promise<void> {
  const xDerecha = ANCHO_PAGINA - MARGEN;
  let xBarras = xDerecha;
  try {
    await pintarQr(doc, urlPedido, xDerecha - LADO_QR, y);
    xBarras = xDerecha - LADO_QR - SEPARACION_IDENTIFICADORES;
  } catch (error) {
    console.error("[mostrador] no se pudo dibujar el QR del PDF", hoja.pedido.id, error);
  }
  // Un borrador no tiene folio: no hay nada que leer con el lector.
  if (!hoja.pedido.folio) return;
  try {
    pintarBarras(doc, hoja.pedido.folio, xBarras, y);
  } catch (error) {
    console.error("[mostrador] no se pudo dibujar el código de barras del PDF", hoja.pedido.folio, error);
  }
}

/** Cabecera completa; devuelve la `y` del filete que la cierra. */
async function pintarCabecera(doc: jsPDF, hoja: HojaSurtido, urlPedido: string): Promise<number> {
  const { pedido } = hoja;
  const folio = pedido.folio ?? `Borrador #${pedido.id}`;
  const y = MARGEN;

  await pintarMarca(doc, MARGEN, y);
  await pintarIdentificadores(doc, hoja, urlPedido, y);

  rotulo(doc, `${NEGOCIO.razonSocial} · Hoja de pedido`, MARGEN, y + 21);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(PT_FOLIO);
  rgb(doc, TINTA);
  doc.text(folio, MARGEN, y + 31);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(PT_CUERPO);
  rgb(doc, TINTA_SUAVE);
  const fecha = fechaHora(pedido.enviadoEn ?? pedido.creadoEn) || "—";
  doc.text(`${fecha} · ${ETIQUETA_ESTATUS[pedido.estatus]}`, MARGEN, y + 37);

  const yFilete = y + 42;
  doc.setDrawColor(TINTA[0], TINTA[1], TINTA[2]);
  doc.setLineWidth(0.5);
  doc.line(MARGEN, yFilete, ANCHO_PAGINA - MARGEN, yFilete);
  return yFilete;
}

/* ------------------------------------------------------------------ */
/* Ficha de datos del pedido                                           */
/* ------------------------------------------------------------------ */

interface Campo {
  etiqueta: string;
  valor: string;
  /** Columnas de 4 que ocupa (default 1). */
  columnas?: number;
  /** Pintar el valor en Courier (fechas, usuarios, teléfonos). */
  mono?: boolean;
  /** Aviso en tinta roja a continuación del valor (traslado). */
  aviso?: string;
}

function camposDelPedido(hoja: HojaSurtido): Campo[] {
  const { pedido } = hoja;
  const telefono = telefonoLegible(pedido.telefono);
  // El número con el que el mostrador ubica al cliente (POS si está ligado, si no el padrón).
  const numeroCliente =
    typeof pedido.idClienteBdav === "number"
      ? `Cliente POS ${pedido.idClienteBdav}`
      : typeof pedido.idCliente === "number"
        ? `Padrón #${pedido.idCliente}`
        : "";
  const campos: Campo[] = [
    { etiqueta: "Cliente", valor: [pedido.cliente, numeroCliente, telefono].filter(Boolean).join("  "), columnas: 2 },
    {
      etiqueta: "Recoge en",
      valor: hoja.sucursal.nombre,
      aviso: hoja.trasladar ? `Trasladar a ${hoja.sucursal.nombre}` : undefined,
    },
    { etiqueta: "Canal", valor: ETIQUETA_CANAL[pedido.canal] },
    { etiqueta: "Capturó", valor: pedido.capturadoPor ?? "cliente", mono: true },
    { etiqueta: "Estatus", valor: ETIQUETA_ESTATUS[pedido.estatus] },
    { etiqueta: "Pedido", valor: fechaHora(pedido.enviadoEn ?? pedido.creadoEn) || "—", mono: true },
    { etiqueta: "Hoja generada", valor: fechaHora(hoja.generadoEn) || "—", mono: true },
  ];
  // Las fechas de avance solo cuando existen: una ficha llena de guiones no dice nada.
  if (pedido.confirmadoEn) campos.push({ etiqueta: "Confirmado", valor: fechaHora(pedido.confirmadoEn), mono: true });
  if (pedido.listoEn) campos.push({ etiqueta: "Listo en sucursal", valor: fechaHora(pedido.listoEn), mono: true });
  if (pedido.entregadoEn) campos.push({ etiqueta: "Entregado", valor: fechaHora(pedido.entregadoEn), mono: true });
  return campos;
}

/** Rejilla de 4 columnas que fluye como el `<dl>` de la página; devuelve la `y` final. */
function pintarCampos(doc: jsPDF, campos: Campo[], yInicio: number): number {
  const anchoColumna = ANCHO_UTIL / 4;
  let columna = 0;
  let y = yInicio;
  let altoFila = 0;

  for (const campo of campos) {
    const span = Math.min(campo.columnas ?? 1, 4);
    if (columna + span > 4) {
      y += altoFila;
      columna = 0;
      altoFila = 0;
    }
    const x = MARGEN + columna * anchoColumna;
    const anchoTexto = anchoColumna * span - 3;
    rotulo(doc, campo.etiqueta, x, y);

    doc.setFont(campo.mono ? "courier" : "helvetica", campo.mono ? "normal" : "bold");
    doc.setFontSize(PT_CUERPO);
    rgb(doc, TINTA);
    const lineas = doc.splitTextToSize(campo.valor, anchoTexto) as string[];
    doc.text(lineas, x, y + 4.5);
    let alto = 4.5 + lineas.length * INTERLINEA;

    if (campo.aviso) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(PT_ROTULO);
      rgb(doc, ANOTACION);
      doc.text(campo.aviso.toUpperCase(), x, y + alto);
      alto += INTERLINEA;
    }
    altoFila = Math.max(altoFila, alto + 2.5);
    columna += span;
  }
  return y + altoFila;
}

/* ------------------------------------------------------------------ */
/* Tabla de renglones                                                  */
/* ------------------------------------------------------------------ */

function filaDe(renglon: RenglonSurtido): string[] {
  return [
    String(renglon.partida),
    ETIQUETA_ORIGEN[renglon.origen],
    referencia(renglon),
    renglon.descripcion,
    String(renglon.cantidad),
    renglon.existenciaActual === null ? "s/d" : String(renglon.existenciaActual),
    renglon.ubicacionUsada ?? "—",
    "",
  ];
}

/** Existencia por debajo de lo pedido: en rojo y negritas, como en pantalla. */
function resaltarFaltantes(renglones: RenglonSurtido[]) {
  return (data: CellHookData) => {
    if (data.section !== "body" || data.column.index !== COLUMNA_EXISTENCIA) return;
    const renglon = renglones[data.row.index];
    if (!renglon || renglon.existenciaActual === null) return;
    if (renglon.existenciaActual < renglon.cantidad) {
      data.cell.styles.textColor = [ANOTACION[0], ANOTACION[1], ANOTACION[2]];
      data.cell.styles.fontStyle = "bold";
    }
  };
}

/** Casilla vacía para palomear al surtir, centrada en su celda. */
function pintarCasilla(data: CellHookData): void {
  if (data.section !== "body" || data.column.index !== COLUMNA_SURTIDO) return;
  const x = data.cell.x + (data.cell.width - LADO_CASILLA) / 2;
  const y = data.cell.y + (data.cell.height - LADO_CASILLA) / 2;
  data.doc.setDrawColor(TINTA[0], TINTA[1], TINTA[2]);
  data.doc.setLineWidth(0.4);
  data.doc.rect(x, y, LADO_CASILLA, LADO_CASILLA, "S");
}

/** Tabla de surtido; devuelve la `y` donde termina (en la página donde termine). */
function pintarTabla(doc: jsPDF, renglones: RenglonSurtido[], yInicio: number): number {
  autoTable(doc, {
    startY: yInicio,
    margin: { top: MARGEN, right: MARGEN, bottom: ALTO_PIE, left: MARGEN },
    theme: "plain",
    head: [["#", "Origen", "Código / ID usada", "Descripción", "Cant.", "Existencia", "Ubicación", "Surtido"]],
    body: renglones.map(filaDe),
    styles: {
      font: "helvetica",
      fontSize: PT_TABLA,
      textColor: [TINTA[0], TINTA[1], TINTA[2]],
      cellPadding: { top: 2.2, right: 1.5, bottom: 2.2, left: 1.5 },
      lineColor: [LINEA[0], LINEA[1], LINEA[2]],
      lineWidth: { bottom: 0.2 },
      valign: "top",
      overflow: "linebreak",
    },
    headStyles: {
      fontStyle: "bold",
      fontSize: PT_CABECERA_TABLA,
      fillColor: [BLANCO[0], BLANCO[1], BLANCO[2]],
      textColor: [TINTA[0], TINTA[1], TINTA[2]],
      lineColor: [TINTA[0], TINTA[1], TINTA[2]],
      lineWidth: { bottom: 0.6 },
    },
    columnStyles: {
      0: { cellWidth: 8, font: "courier", textColor: [TINTA_SUAVE[0], TINTA_SUAVE[1], TINTA_SUAVE[2]] },
      1: { cellWidth: 20 },
      2: { cellWidth: 30, font: "courier", fontStyle: "bold" },
      3: { cellWidth: "auto" },
      4: { cellWidth: 14, halign: "right", fontStyle: "bold", fontSize: PT_CUERPO },
      5: { cellWidth: 20, halign: "right", font: "courier" },
      6: { cellWidth: 26, font: "courier" },
      7: { cellWidth: 16, halign: "center" },
    },
    didParseCell: resaltarFaltantes(renglones),
    didDrawCell: pintarCasilla,
  });
  // autoTable deja la `y` final en el documento; sin filas no hay tabla y se queda donde empezó.
  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY;
  return finalY ?? yInicio;
}

/* ------------------------------------------------------------------ */
/* Observaciones, firmas y pie                                         */
/* ------------------------------------------------------------------ */

/** Salta de página si lo que sigue no cabe encima del pie; devuelve la `y` donde pintar. */
function asegurarEspacio(doc: jsPDF, y: number, altoNecesario: number): number {
  if (y + altoNecesario <= ALTO_PAGINA - ALTO_PIE) return y;
  doc.addPage();
  return MARGEN;
}

function pintarObservaciones(doc: jsPDF, hoja: HojaSurtido, yInicio: number): number {
  const texto = hoja.pedido.observaciones ?? "Sin observaciones.";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(PT_CUERPO);
  const lineas = doc.splitTextToSize(texto, ANCHO_UTIL) as string[];
  const alto = 6 + lineas.length * INTERLINEA + 8;
  const y = asegurarEspacio(doc, yInicio, alto);

  rotulo(doc, "Observaciones", MARGEN, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(PT_CUERPO);
  rgb(doc, hoja.pedido.observaciones ? TINTA : TINTA_SUAVE);
  doc.text(lineas, MARGEN, y + 4.5);

  doc.setFontSize(PT_ROTULO);
  rgb(doc, TINTA_SUAVE);
  const yNota = y + 4.5 + lineas.length * INTERLINEA + 2;
  doc.text('La existencia es la de bdav / Bodega Usado al generar la hoja; "s/d" = la base no respondió.', MARGEN, yNota);
  return yNota + 4;
}

/** Dos rayas de firma lado a lado: quien surtió y quien recibió. */
function pintarFirmas(doc: jsPDF, yInicio: number): number {
  const ALTO_FIRMA = 22;
  const y = asegurarEspacio(doc, yInicio, ALTO_FIRMA);
  const anchoFirma = (ANCHO_UTIL - 20) / 2;
  const yRaya = y + 14;
  doc.setDrawColor(TINTA[0], TINTA[1], TINTA[2]);
  doc.setLineWidth(0.5);
  const firmas: Array<{ x: number; etiqueta: string }> = [
    { x: MARGEN, etiqueta: "Surtió (nombre y firma)" },
    { x: MARGEN + anchoFirma + 20, etiqueta: "Recibió (nombre y firma)" },
  ];
  for (const firma of firmas) {
    doc.line(firma.x, yRaya, firma.x + anchoFirma, yRaya);
    rotulo(doc, firma.etiqueta, firma.x, yRaya + 4);
  }
  return yRaya + ALTO_FIRMA - 14;
}

/** Pie en TODAS las páginas; va al final porque hasta entonces no se sabe cuántas son. */
function pintarPies(doc: jsPDF, generadoEn: string): void {
  const total = doc.getNumberOfPages();
  const yPie = ALTO_PAGINA - MARGEN + 2;
  for (let pagina = 1; pagina <= total; pagina += 1) {
    doc.setPage(pagina);
    doc.setDrawColor(LINEA[0], LINEA[1], LINEA[2]);
    doc.setLineWidth(0.2);
    doc.line(MARGEN, yPie - 4, ANCHO_PAGINA - MARGEN, yPie - 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(PT_ROTULO);
    rgb(doc, TINTA_SUAVE);
    doc.text(`Generado el ${generadoEn} · ${NEGOCIO.nombre}`, MARGEN, yPie);
    doc.text(`Página ${pagina} de ${total}`, ANCHO_PAGINA - MARGEN, yPie, { align: "right" });
  }
}

/* ------------------------------------------------------------------ */
/* Documento                                                           */
/* ------------------------------------------------------------------ */

export interface OpcionesPdfPedido {
  /** Liga absoluta al pedido en el mostrador; es lo que codifica el QR. */
  urlPedido: string;
}

/** La hoja de pedido como PDF (bytes listos para responder o guardar). */
export async function pdfHojaPedido(hoja: HojaSurtido, opciones: OpcionesPdfPedido): Promise<ArrayBuffer> {
  // `compress` deja los flujos (texto e imágenes) en deflate: sin él el logo
  // y el QR van crudos y la hoja pesa medio mega.
  const doc = new jsPDF({ unit: "mm", format: "letter", orientation: "portrait", compress: true });
  doc.setProperties({
    title: `Hoja de pedido ${hoja.pedido.folio ?? `#${hoja.pedido.id}`}`,
    subject: "Hoja de surtido del mostrador",
    author: NEGOCIO.razonSocial,
    creator: NEGOCIO.nombre,
  });

  const yFilete = await pintarCabecera(doc, hoja, opciones.urlPedido);
  const yCampos = pintarCampos(doc, camposDelPedido(hoja), yFilete + 6);

  let y: number;
  if (hoja.renglones.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(PT_CUERPO);
    rgb(doc, TINTA_SUAVE);
    doc.text("Este pedido no tiene partidas que surtir.", MARGEN, yCampos + 6);
    y = yCampos + 10;
  } else {
    y = pintarTabla(doc, hoja.renglones, yCampos + 3);
  }

  y = pintarObservaciones(doc, hoja, y + 8);
  pintarFirmas(doc, y + 6);
  pintarPies(doc, fechaHora(hoja.generadoEn) || fechaHora(ahoraMonterrey()));

  return doc.output("arraybuffer");
}
