// URLs de las fotos de catálogo servidas por los proxys propios. Van SIEMPRE
// por aquí y no armadas a mano, por el parámetro `v`: las rutas de foto cachean
// fuerte (7 días en el navegador, 1 año en el CDN), así que cuando cambia lo
// que se estampa (la marca de agua) hay que cambiar la URL o los visitantes
// siguen viendo la versión vieja hasta una semana. Súbele a VERSION_FOTOS cada
// vez que el sello cambie.
//
// Este archivo no toca base de datos ni Node: lo importan por igual componentes
// de servidor y de cliente.

export const VERSION_FOTOS = 2;

/** Foto de artículo NUEVO (proxy /api/foto). `codigo` es `ProductoResumen.foto`
 *  (la columna `imagen` cuando está capturada, si no el código). */
export function urlFotoNueva(codigo: string): string {
  return `/api/foto?codigo=${encodeURIComponent(codigo)}&v=${VERSION_FOTOS}`;
}

/** Foto REAL de pieza usada (proxy /api/usadas/foto). `nombre` es el
 *  `nombre_imagen` de la galería de la Bodega. */
export function urlFotoUsada(nombre: string): string {
  return `/api/usadas/foto?n=${encodeURIComponent(nombre)}&v=${VERSION_FOTOS}`;
}
