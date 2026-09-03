// A dónde mandar al vendedor después de entrar. El proxy pone `?volver=<ruta>`
// cuando lo saca a login; aquí se acota para que un enlace mal armado (o
// malicioso) nunca lo lleve fuera de /mostrador ni a otro dominio.

export const RUTA_MOSTRADOR = "/mostrador";
export const RUTA_LOGIN_MOSTRADOR = "/mostrador/login";

/** Devuelve `volver` si es una ruta interna de /mostrador distinta de login; si no, /mostrador. */
export function destinoTrasLogin(volver: unknown): string {
  if (typeof volver !== "string") return RUTA_MOSTRADOR;
  const ruta = volver.trim();
  // "//otro.sitio" y "/\otro" son redirecciones absolutas disfrazadas.
  if (!ruta.startsWith("/") || ruta.startsWith("//") || ruta.startsWith("/\\")) return RUTA_MOSTRADOR;
  const esDeMostrador = ruta === RUTA_MOSTRADOR || ruta.startsWith(`${RUTA_MOSTRADOR}/`) || ruta.startsWith(`${RUTA_MOSTRADOR}?`);
  if (!esDeMostrador) return RUTA_MOSTRADOR;
  if (ruta === RUTA_LOGIN_MOSTRADOR || ruta.startsWith(`${RUTA_LOGIN_MOSTRADOR}?`)) return RUTA_MOSTRADOR;
  return ruta;
}
