// Rutas del área de clientes en un solo lugar: las usan el guardia de borde
// (`src/proxy.ts`), las páginas, la barra y la configuración por área
// (`lib/kiosco/area.ts`). Es el área del cliente en SU dispositivo: entra con
// celular y contraseña, arma su pedido, elige sucursal, ve sus pedidos y
// cambia su contraseña. Nada de aquí lleva a la cola ni al mostrador.

/** Entrar: la única ruta del área que se ve SIN sesión de cliente. */
export const RUTA_CLIENTES = "/clientes";
/** Armar el pedido (Vico por default, buscador como opción). */
export const RUTA_CLIENTES_PEDIDO = "/clientes/pedido";
/** Elegir sucursal y observaciones; aquí vive el botón de enviar. */
export const RUTA_CLIENTES_DATOS = "/clientes/datos";
/** Acuse con el folio. */
export const RUTA_CLIENTES_LISTO = "/clientes/listo";
export const RUTA_CLIENTES_MIS_PEDIDOS = "/clientes/mis-pedidos";
export const RUTA_CLIENTES_PASSWORD = "/clientes/password";

/** `true` si la ruta pertenece al área de clientes (y no a `/clientesalgo`). */
export function esRutaClientes(pathname: string): boolean {
  return pathname === RUTA_CLIENTES || pathname.startsWith(`${RUTA_CLIENTES}/`);
}

/** `true` si la ruta se puede ver sin haber entrado: solo la de entrar. */
export function esRutaClientesAbierta(pathname: string): boolean {
  return pathname === RUTA_CLIENTES;
}
