// Rutas del kiosco en un solo lugar: las usan el guardia de borde
// (`src/proxy.ts`), las páginas y los formularios de activación y salida.
// El kiosco NO tiene navegación: estas cinco son todas las pantallas que
// existen, y ninguna lleva al resto del sitio.

export const RUTA_KIOSCO = "/kiosco";
/** Datos del cliente: el paso 2, con el resumen y el botón de enviar. */
export const RUTA_KIOSCO_PEDIDO = "/kiosco/pedido";
/** Acuse con el folio: el paso 3. */
export const RUTA_KIOSCO_LISTO = "/kiosco/listo";
/** Alta del aparato (usuario y clave del POS); fuera del candado. */
export const RUTA_KIOSCO_ACTIVAR = "/kiosco/activar";
/** Salida del modo kiosco (usuario y clave del POS); fuera del candado. */
export const RUTA_KIOSCO_SALIR = "/kiosco/salir";

/** Rutas de /kiosco que se pueden ver SIN cookie de dispositivo. */
export const RUTAS_KIOSCO_ABIERTAS: ReadonlyArray<string> = [
  RUTA_KIOSCO_ACTIVAR,
  RUTA_KIOSCO_SALIR,
];

/** `true` si la ruta pertenece al área del kiosco (y no a `/kioscoalgo`). */
export function esRutaKiosco(pathname: string): boolean {
  return pathname === RUTA_KIOSCO || pathname.startsWith(`${RUTA_KIOSCO}/`);
}

/** `true` si la ruta se puede ver sin haber activado el aparato. */
export function esRutaKioscoAbierta(pathname: string): boolean {
  return RUTAS_KIOSCO_ABIERTAS.includes(pathname);
}
