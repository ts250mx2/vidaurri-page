// Utilidades de texto para búsquedas.

/**
 * Raíz de una palabra para búsqueda con LIKE: quita la terminación de género/
 * número ("delantera" → "delanter", "usados" → "usad") para que cruce con
 * capturas como "DELANTERO(A)" o "DERECHO(A)" de la Bodega Usado. Si la raíz
 * queda muy corta se conserva la palabra original.
 */
export function raizBusqueda(palabra: string): string {
  const raiz = palabra.replace(/(os|as)$/i, "").replace(/[oa]$/i, "");
  return raiz.length >= 3 ? raiz : palabra;
}

/**
 * Primera palabra del tipo de parte, sin puntuación pegada ni plural:
 * "FACIAS DELANTERAS" → "FACIA", "PUERTAS, TAPAS CAJA..." → "PUERTA".
 * Para cruzar el catálogo de nuevas (plural) con la Bodega Usado y con el
 * catálogo del proveedor (singular); el resto de palabras del tipo solo
 * estorbaría en esos catálogos.
 */
export function raizParte(parte: string): string {
  const primera = parte.trim().split(/\s+/)[0] ?? "";
  return primera.replace(/[^\p{L}]+$/u, "").replace(/S$/i, "");
}
