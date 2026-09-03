import { createElement, Fragment, isValidElement, type ReactElement, type ReactNode } from "react";
import sharp from "sharp";
import { LogoAV } from "@/components/LogoAV";

// La V de la casa como PNG para el PDF de la hoja de pedido. jsPDF no dibuja
// SVG, así que se toma el MISMO componente del header (`LogoAV`, la parte
// vectorial del lockup `MarcaAV`; el rótulo "Autopartes / Vidaurri" es HTML y
// lo escribe el PDF en texto), se serializa a markup SVG y sharp lo
// rasteriza. SOLO SERVIDOR: importa sharp.
//
// NO se usa `renderToStaticMarkup`: Next prohíbe importar react-dom/server en
// la capa de app (error E394, también en route handlers). El logo es un árbol
// de elementos SVG intrínsecos sin estado, así que basta un serializador
// mínimo propio: recorre los elementos, llama a los componentes de función y
// escribe etiquetas y atributos. Si `LogoAV` algún día usa hooks o contexto,
// esto lanza y el PDF sale con el nombre en texto (ver `logoPng`).
//
// Se cachea por lado en un Map de módulo: el logo no cambia entre pedidos y
// rasterizar cuesta ~20 ms que no hay por qué pagar en cada hoja.

/** Lado del PNG en px: sobra para 14 mm a 300 dpi sin engordar el PDF. */
const LADO_PNG = 160;

const cachePng = new Map<number, Buffer>();

/** Atributos SVG que React escribe en camelCase y el SVG también (no se pasan a kebab). */
const ATRIBUTOS_CAMEL = new Set([
  "viewBox",
  "preserveAspectRatio",
  "gradientUnits",
  "gradientTransform",
  "spreadMethod",
  "patternUnits",
  "patternTransform",
  "clipPathUnits",
  "maskUnits",
  "markerUnits",
]);

/** Props de React que no son atributos del SVG. */
const PROPS_IGNORADAS = new Set(["children", "key", "ref", "dangerouslySetInnerHTML"]);

function escapar(texto: string): string {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function nombreAtributo(prop: string): string {
  if (prop === "className") return "class";
  if (ATRIBUTOS_CAMEL.has(prop) || prop.includes("-")) return prop;
  // stopColor → stop-color, strokeWidth → stroke-width.
  return prop.replace(/[A-Z]/g, (letra) => `-${letra.toLowerCase()}`);
}

function atributosDe(props: Record<string, unknown>): string {
  const partes: string[] = [];
  for (const [prop, valor] of Object.entries(props)) {
    if (PROPS_IGNORADAS.has(prop) || valor === null || valor === undefined || valor === false) continue;
    // `aria-hidden` sin valor en JSX es `true` y en SVG se escribe "true".
    const texto = valor === true ? "true" : String(valor);
    partes.push(` ${nombreAtributo(prop)}="${escapar(texto)}"`);
  }
  return partes.join("");
}

function serializarNodo(nodo: ReactNode): string {
  if (nodo === null || nodo === undefined || typeof nodo === "boolean") return "";
  if (typeof nodo === "string" || typeof nodo === "number") return escapar(String(nodo));
  if (Array.isArray(nodo)) return nodo.map(serializarNodo).join("");
  if (isValidElement(nodo)) return serializarElemento(nodo as ReactElement<Record<string, unknown>>);
  throw new Error("Logo: nodo de React no serializable (¿promesa, portal o iterador?)");
}

function serializarElemento(elemento: ReactElement<Record<string, unknown>>): string {
  const { type, props } = elemento;
  if (type === Fragment) return serializarNodo(props.children as ReactNode);
  if (typeof type === "function") {
    // Componente de función puro: se llama como lo haría React, sin hooks.
    const render = type as (p: Record<string, unknown>) => ReactNode;
    return serializarNodo(render(props));
  }
  if (typeof type !== "string") throw new Error("Logo: tipo de elemento no soportado en el serializador SVG");
  const hijos = serializarNodo(props.children as ReactNode);
  return `<${type}${atributosDe(props)}>${hijos}</${type}>`;
}

/** Markup SVG de `LogoAV` con el `xmlns` que librsvg exige en la raíz (React no lo pone). */
export function svgLogoAV(lado: number): string {
  const svg = serializarElemento(createElement(LogoAV, { lado }) as ReactElement<Record<string, unknown>>);
  if (!svg.startsWith("<svg")) throw new Error("Logo: el componente no devolvió un <svg> en la raíz");
  return svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
}

/** PNG cuadrado del logo sobre blanco (la hoja es blanca), o null si no se pudo. */
export async function logoPng(lado: number = LADO_PNG): Promise<Buffer | null> {
  const enCache = cachePng.get(lado);
  if (enCache) return enCache;
  try {
    // Sin canal alfa a propósito: jsPDF guarda el alfa como máscara aparte y
    // el PDF crece; sobre hoja blanca el fondo blanco es indistinguible.
    const png = await sharp(Buffer.from(svgLogoAV(lado))).flatten({ background: "#ffffff" }).png().toBuffer();
    cachePng.set(lado, png);
    return png;
  } catch (error) {
    console.error("[mostrador] no se pudo rasterizar el logo para el PDF", error);
    return null;
  }
}
