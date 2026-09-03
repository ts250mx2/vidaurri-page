// Code 128 puro, sin dependencias: el folio del pedido impreso como código de
// barras en la hoja de pedido para que el mostrador lo lea con el lector del
// POS en vez de teclearlo. Es una función pura (texto → módulos → SVG) para
// poder probarla contra codificaciones conocidas y reutilizarla en el PDF.
//
// Arranca en el subconjunto B (ASCII 32-126) y, si se permite, cambia al C
// para tramos de 4+ dígitos (dos dígitos por símbolo: "P-000131" pasa de 11
// a 9 símbolos y sale más corto en el papel). Fuera de ASCII imprimible no
// hay codificación posible y se avisa con un Error legible.

/** Un módulo del símbolo: ancho en unidades y si es barra (tinta) o espacio. */
export interface ModuloCodigo128 {
  ancho: number;
  barra: boolean;
}

export interface Codigo128 {
  /** Valores de símbolo, empezando por START y sin checksum ni STOP. */
  simbolos: number[];
  /** Símbolo de verificación (suma ponderada módulo 103). */
  checksum: number;
  /** Barras y espacios de punta a punta, sin zona de silencio. */
  modulos: ModuloCodigo128[];
  /** Ancho total en módulos, sin zona de silencio. */
  anchoModulos: number;
}

export interface OpcionesCodigo128 {
  /** Usar el subconjunto C en tramos numéricos largos (default true). */
  subconjuntoC?: boolean;
}

export interface OpcionesSvgCodigo128 extends OpcionesCodigo128 {
  /** Alto de las barras en px (default 48). */
  alto?: number;
  /** Ancho de un módulo en px (default 2). */
  modulo?: number;
  /** Imprimir el texto en monoespaciada debajo de las barras (default true). */
  conTexto?: boolean;
}

/* Anchos de los 107 símbolos (0-105 más STOP). Cada uno alterna barra,
   espacio, barra, espacio, barra, espacio y suma 11 módulos; STOP añade la
   barra final y suma 13. Es la tabla normativa ISO/IEC 15417. */
const PATRONES: readonly string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
];

const CODIGO_B = 100;
const CODIGO_C = 99;
const START_B = 104;
const START_C = 105;
const STOP = 106;
const MODULO_CHECKSUM = 103;
/** Mínimo de dígitos seguidos para que cambiar a C ahorre símbolos. */
const MINIMO_TRAMO_C = 4;
const ASCII_MIN = 32;
const ASCII_MAX = 126;
/** Zona de silencio normativa a cada lado, en módulos. */
export const ZONA_SILENCIO = 10;

const ES_DIGITO = /[0-9]/;

function validarTexto(texto: string): void {
  if (texto.length === 0) throw new Error("Code 128: el texto está vacío");
  for (let i = 0; i < texto.length; i += 1) {
    const codigo = texto.charCodeAt(i);
    if (codigo < ASCII_MIN || codigo > ASCII_MAX) {
      throw new Error(
        `Code 128: carácter no soportado "${texto[i]}" (código ${codigo}) en la posición ${i}; solo ASCII imprimible 32-126`
      );
    }
  }
}

/** Largo del tramo de dígitos que empieza en `desde`. */
function largoTramoNumerico(texto: string, desde: number): number {
  let fin = desde;
  while (fin < texto.length && ES_DIGITO.test(texto[fin])) fin += 1;
  return fin - desde;
}

/** Símbolos del cuerpo (sin START) alternando B y C según convenga. */
function simbolosDelCuerpo(texto: string, conC: boolean, arrancaEnC: boolean): number[] {
  const simbolos: number[] = [];
  let enC = arrancaEnC;
  let i = 0;
  while (i < texto.length) {
    const tramo = conC ? largoTramoNumerico(texto, i) : 0;
    if (tramo >= MINIMO_TRAMO_C || (enC && tramo >= 2)) {
      // Un tramo impar deja su primer dígito en B para que el resto sea par.
      const pares = tramo - (tramo % 2);
      const inicio = tramo % 2 === 1 ? i + 1 : i;
      if (tramo % 2 === 1) {
        if (enC) {
          simbolos.push(CODIGO_B);
          enC = false;
        }
        simbolos.push(texto.charCodeAt(i) - ASCII_MIN);
      }
      if (!enC) {
        simbolos.push(CODIGO_C);
        enC = true;
      }
      for (let j = inicio; j < inicio + pares; j += 2) {
        simbolos.push(Number(texto.slice(j, j + 2)));
      }
      i = inicio + pares;
      continue;
    }
    if (enC) {
      simbolos.push(CODIGO_B);
      enC = false;
    }
    simbolos.push(texto.charCodeAt(i) - ASCII_MIN);
    i += 1;
  }
  return simbolos;
}

function checksumDe(simbolos: number[]): number {
  // El START pesa 1 y cada símbolo siguiente pesa su posición (1, 2, 3…).
  const suma = simbolos.reduce((acumulado, valor, indice) => acumulado + valor * Math.max(indice, 1), 0);
  return suma % MODULO_CHECKSUM;
}

function modulosDe(patron: string): ModuloCodigo128[] {
  return Array.from(patron, (ancho, indice) => ({ ancho: Number(ancho), barra: indice % 2 === 0 }));
}

/** Codifica `texto` en Code 128 y devuelve símbolos, checksum y módulos. */
export function codificarCodigo128(texto: string, opciones: OpcionesCodigo128 = {}): Codigo128 {
  validarTexto(texto);
  const conC = opciones.subconjuntoC ?? true;
  // Todo dígitos y en cantidad par: arrancar en C se ahorra el cambio.
  const arrancaEnC =
    conC && texto.length >= MINIMO_TRAMO_C && texto.length % 2 === 0 && largoTramoNumerico(texto, 0) === texto.length;
  const simbolos = [arrancaEnC ? START_C : START_B, ...simbolosDelCuerpo(texto, conC, arrancaEnC)];
  const checksum = checksumDe(simbolos);
  const modulos = [...simbolos, checksum, STOP].flatMap((valor) => modulosDe(PATRONES[valor]));
  const anchoModulos = modulos.reduce((total, modulo) => total + modulo.ancho, 0);
  return { simbolos, checksum, modulos, anchoModulos };
}

function escaparXml(texto: string): string {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Tamaño del texto bajo las barras y el espacio que se le reserva, en px. */
const TAMANO_TEXTO = 12;
const ALTO_TEXTO = 18;

/**
 * SVG inline del código de barras: barras negras sobre blanco, zona de
 * silencio de 10 módulos a cada lado y, si `conTexto`, el texto en
 * monoespaciada debajo. Sirve igual en pantalla, en impresión y en el PDF.
 */
export function svgCodigo128(texto: string, opciones: OpcionesSvgCodigo128 = {}): string {
  const { alto = 48, modulo = 2, conTexto = true, subconjuntoC } = opciones;
  const codigo = codificarCodigo128(texto, { subconjuntoC });

  const ancho = (codigo.anchoModulos + ZONA_SILENCIO * 2) * modulo;
  const altoTotal = alto + (conTexto ? ALTO_TEXTO : 0);

  let x = ZONA_SILENCIO * modulo;
  const barras: string[] = [];
  for (const { ancho: anchoModulo, barra } of codigo.modulos) {
    const w = anchoModulo * modulo;
    if (barra) barras.push(`<rect x="${x}" y="0" width="${w}" height="${alto}"/>`);
    x += w;
  }

  const etiqueta = conTexto
    ? `<text x="${ancho / 2}" y="${alto + TAMANO_TEXTO + 2}" text-anchor="middle" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="${TAMANO_TEXTO}" letter-spacing="0.12em">${escaparXml(texto)}</text>`
    : "";

  // shape-rendering="crispEdges": un lector necesita filos netos, no barras
  // suavizadas por el antialias de la pantalla.
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${altoTotal}" viewBox="0 0 ${ancho} ${altoTotal}" ` +
    `role="img" aria-label="Código de barras ${escaparXml(texto)}" shape-rendering="crispEdges">` +
    `<rect width="${ancho}" height="${altoTotal}" fill="#fff"/>` +
    `<g fill="#000">${barras.join("")}${etiqueta}</g>` +
    `</svg>`
  );
}
