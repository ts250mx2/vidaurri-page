import ExcelJS from "exceljs";
import { ETIQUETA_SUCURSAL, etiquetaBkoPos, fechaHora } from "./etiquetas";
import { ETIQUETA_ESTATUS } from "./reglas";
import type { HojaBackorder, PedidoResumen } from "./tipos";

// El libro de Excel de las back orders a Aldo: lo mismo que enseña la pantalla
// /mostrador/backorders, pero para llevárselo (cotejar con lo que Aldo surte,
// mandárselo a alguien, filtrarlo). Dos hojas: "Back orders", un renglón por
// back order con lo que se ve en la lista, y "Piezas", un renglón por pieza
// pedida, que es lo que la lista no enseña sin abrir hoja por hoja. Puro: recibe
// los datos ya leídos y devuelve los bytes; de dónde salen es asunto de la ruta.
// Solo servidor: exceljs no viaja al navegador.

/** Una back order con su hoja; `hoja` null si IA no la entregó (el renglón sale igual, sin piezas). */
export interface BackorderParaExcel {
  pedido: PedidoResumen;
  hoja: HojaBackorder | null;
}

export const TIPO_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const FORMATO_PESOS = '"$"#,##0.00';
/** Grafito de la cabecera de las tablas del mostrador, en ARGB como lo pide exceljs. */
const COLOR_CABECERA = "FF171B21";
const COLOR_TEXTO_CABECERA = "FFFFFFFF";
const SIN_HOJA = "No se pudo leer la hoja";

type Celda = string | number | null;

interface ColumnaExcel {
  titulo: string;
  ancho: number;
  pesos?: boolean;
}

const COLUMNAS_BACKORDERS: ReadonlyArray<ColumnaExcel> = [
  { titulo: "Back order", ancho: 12 },
  { titulo: "Estado", ancho: 28 },
  { titulo: "Detalle del estado", ancho: 40 },
  { titulo: "Pedido", ancho: 12 },
  { titulo: "Fecha del pedido", ancho: 20 },
  { titulo: "Estatus del pedido", ancho: 18 },
  { titulo: "Cliente", ancho: 36 },
  { titulo: "ID cliente POS", ancho: 14 },
  { titulo: "Teléfono", ancho: 14 },
  { titulo: "Sucursal", ancho: 16 },
  { titulo: "Entrega Aldo", ancho: 13 },
  { titulo: "Vendedor", ancho: 14 },
  { titulo: "Piezas a Aldo", ancho: 13 },
  { titulo: "Back order sin IVA", ancho: 18, pesos: true },
  { titulo: "Total del pedido (IVA incluido)", ancho: 28, pesos: true },
];

const COLUMNAS_PIEZAS: ReadonlyArray<ColumnaExcel> = [
  { titulo: "Back order", ancho: 12 },
  { titulo: "Pedido", ancho: 12 },
  { titulo: "Cliente", ancho: 36 },
  { titulo: "Entrega Aldo", ancho: 13 },
  { titulo: "Partida", ancho: 9 },
  { titulo: "Código", ancho: 18 },
  { titulo: "Descripción", ancho: 52 },
  { titulo: "Cantidad a Aldo", ancho: 15 },
  { titulo: "Cantidad pedida", ancho: 15 },
  { titulo: "Precio sin IVA", ancho: 15, pesos: true },
  { titulo: "Importe sin IVA", ancho: 16, pesos: true },
  { titulo: "Días de entrega", ancho: 15 },
];

function folioDe(pedido: PedidoResumen): string {
  return pedido.folio ?? `#${pedido.id}`;
}

function renglonBackorder({ pedido, hoja }: BackorderParaExcel): Celda[] {
  const estado = pedido.bkoPosEstado;
  const piezas = hoja ? hoja.renglones.reduce((suma, renglon) => suma + renglon.cantidad, 0) : null;
  return [
    pedido.numBkoPos ?? null,
    estado ? etiquetaBkoPos(estado) : null,
    [pedido.bkoPosError, hoja ? null : SIN_HOJA].filter(Boolean).join(" · ") || null,
    folioDe(pedido),
    fechaHora(pedido.creadoEn) || null,
    ETIQUETA_ESTATUS[pedido.estatus],
    pedido.cliente,
    pedido.idClienteBdav,
    pedido.telefono,
    ETIQUETA_SUCURSAL[pedido.sucursal],
    pedido.bkoPosCompromiso ?? null,
    hoja?.backorder.vendedor ?? null,
    piezas,
    hoja ? hoja.totales.subtotal : null,
    pedido.total,
  ];
}

function renglonesPiezas({ pedido, hoja }: BackorderParaExcel): Celda[][] {
  if (!hoja) return [];
  return hoja.renglones.map((renglon) => [
    pedido.numBkoPos ?? null,
    folioDe(pedido),
    pedido.cliente,
    pedido.bkoPosCompromiso ?? null,
    renglon.partida,
    renglon.codigo,
    renglon.descripcion,
    renglon.cantidad,
    renglon.cantidadPedida ?? renglon.cantidad,
    renglon.precioSinIva,
    renglon.importeSinIva,
    renglon.diasEntrega,
  ]);
}

/** Hoja con cabecera grafito fija, autofiltro y las columnas de dinero en pesos. */
function agregarHoja(
  libro: ExcelJS.Workbook,
  nombre: string,
  columnas: ReadonlyArray<ColumnaExcel>,
  renglones: Celda[][]
): void {
  const hoja = libro.addWorksheet(nombre, { views: [{ state: "frozen", ySplit: 1 }] });
  hoja.columns = columnas.map((columna) => ({
    header: columna.titulo,
    width: columna.ancho,
    style: columna.pesos ? { numFmt: FORMATO_PESOS } : {},
  }));
  hoja.addRows(renglones);

  const cabecera = hoja.getRow(1);
  cabecera.font = { bold: true, color: { argb: COLOR_TEXTO_CABECERA } };
  cabecera.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_CABECERA } };
  cabecera.alignment = { vertical: "middle" };
  hoja.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columnas.length } };
}

/** Los bytes del .xlsx. `rango` es el texto legible del periodo ("1–18 sep 2026"); va en las propiedades del libro. */
export async function libroBackorders(
  backorders: ReadonlyArray<BackorderParaExcel>,
  rango: string
): Promise<Uint8Array> {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Autopartes Vidaurri · Mostrador";
  libro.title = rango ? `Back orders a Aldo · ${rango}` : "Back orders a Aldo";
  libro.created = new Date();

  agregarHoja(libro, "Back orders", COLUMNAS_BACKORDERS, backorders.map(renglonBackorder));
  agregarHoja(libro, "Piezas", COLUMNAS_PIEZAS, backorders.flatMap(renglonesPiezas));

  return new Uint8Array(await libro.xlsx.writeBuffer());
}
