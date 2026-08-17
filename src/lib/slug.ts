// Slugs para las URLs semanticas del catalogo:
// /refacciones/nissan/versa/2016/facias-delanteras
// El slug se deriva del nombre en la base (linea/modelo/parte); la busqueda
// inversa se hace comparando slugs, nunca interpolando el texto en SQL.

export function slugificar(texto: string): string {
  // NFD separa las letras de sus acentos; los diacriticos (y cualquier otro
  // caracter fuera de ASCII) se descartan por punto de codigo, sin regex de
  // rangos Unicode que los editores puedan corromper.
  let ascii = "";
  for (const ch of texto.normalize("NFD")) {
    if (ch.charCodeAt(0) <= 0x7f) ascii += ch;
  }
  return ascii
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Busca en una lista el elemento cuyo nombre produce el slug dado. */
export function porSlug<T>(
  lista: T[],
  slug: string,
  nombreDe: (el: T) => string
): T | undefined {
  const objetivo = slug.toLowerCase();
  return lista.find((el) => slugificar(nombreDe(el)) === objetivo);
}
