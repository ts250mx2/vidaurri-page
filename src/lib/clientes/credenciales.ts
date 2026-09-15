import { soloDigitos, TELEFONO_DIGITOS } from "@/lib/kiosco/identidad";

// Validación PURA de lo que el cliente teclea para entrar y para cambiar su
// contraseña. Es la misma regla que aplica IA (`clientes-acceso.ts`, contrato
// del 15 sep 2026): usuario = celular nacional de 10 dígitos; contraseña de
// entrada 1..64; contraseña nueva 8..64, sin espacios al inicio o al final y
// distinta del celular. Aquí solo sirve para que el error salga al instante y
// para que un dato mal formado no salga siquiera del navegador: la que manda
// es la de IA, que responde 400 con el motivo y la pantalla lo enseña tal cual.
//
// Sin dependencias de Next ni del navegador: la usan los formularios (cliente)
// y los proxies (servidor).

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 64;

export const ERROR_USUARIO = "Escribe tu celular a 10 dígitos, con la clave de tu ciudad";
export const ERROR_PASSWORD_VACIA = "Escribe tu contraseña";
export const ERROR_PASSWORD_LARGA = `La contraseña no puede pasar de ${PASSWORD_MAX} caracteres`;
export const ERROR_NUEVA_CORTA = `La contraseña nueva debe tener al menos ${PASSWORD_MIN} caracteres`;
export const ERROR_NUEVA_ESPACIOS = "La contraseña nueva no puede empezar ni terminar con espacios";
export const ERROR_NUEVA_IGUAL_CELULAR = "La contraseña nueva no puede ser tu celular";
export const ERROR_CONFIRMACION = "La confirmación no coincide con la contraseña nueva";

/** Las reglas tal como se enseñan junto al formulario de cambio. */
export const REGLAS_PASSWORD: ReadonlyArray<string> = [
  `De ${PASSWORD_MIN} a ${PASSWORD_MAX} caracteres`,
  "Distinta de tu celular",
  "Sin espacios al inicio ni al final",
];

export interface CredencialesCliente {
  /** Celular nacional de 10 dígitos: hoy el usuario es el celular. */
  usuario: string;
  password: string;
}

export type ValidacionCredenciales =
  | { ok: true; datos: CredencialesCliente }
  | { ok: false; error: string; campo: "usuario" | "password" };

/**
 * Usuario y contraseña para entrar. Del usuario se quedan solo los dígitos
 * (el cliente teclea espacios y guiones); la contraseña va tal cual, sin
 * recortar: si la puso con espacios, así la guardó IA.
 */
export function validarCredencialesCliente(entrada: unknown): ValidacionCredenciales {
  const { usuario, password } =
    typeof entrada === "object" && entrada !== null
      ? (entrada as { usuario?: unknown; password?: unknown })
      : { usuario: undefined, password: undefined };
  const digitos = typeof usuario === "string" ? soloDigitos(usuario) : "";
  if (digitos.length !== TELEFONO_DIGITOS) return { ok: false, error: ERROR_USUARIO, campo: "usuario" };
  if (typeof password !== "string" || !password) {
    return { ok: false, error: ERROR_PASSWORD_VACIA, campo: "password" };
  }
  if (password.length > PASSWORD_MAX) return { ok: false, error: ERROR_PASSWORD_LARGA, campo: "password" };
  return { ok: true, datos: { usuario: digitos, password } };
}

export type CampoCambio = "actual" | "nueva" | "confirmacion";

export type ValidacionCambio =
  | { ok: true; datos: { actual: string; nueva: string } }
  | { ok: false; error: string; campo: CampoCambio };

/**
 * Cambio de contraseña: la actual (1..64), la nueva (8..64, sin espacios en
 * los extremos, distinta del celular si se conoce) y su confirmación. El
 * celular es opcional porque en la pantalla no se baja el número del cliente:
 * IA vuelve a comprobar esa regla con el celular del padrón.
 */
export function validarCambioPassword(
  actual: unknown,
  nueva: unknown,
  confirmacion: unknown,
  celular: string | null = null
): ValidacionCambio {
  if (typeof actual !== "string" || !actual) return { ok: false, error: ERROR_PASSWORD_VACIA, campo: "actual" };
  if (actual.length > PASSWORD_MAX) return { ok: false, error: ERROR_PASSWORD_LARGA, campo: "actual" };
  if (typeof nueva !== "string" || nueva.length < PASSWORD_MIN) {
    return { ok: false, error: ERROR_NUEVA_CORTA, campo: "nueva" };
  }
  if (nueva.length > PASSWORD_MAX) return { ok: false, error: ERROR_PASSWORD_LARGA, campo: "nueva" };
  if (nueva !== nueva.trim()) return { ok: false, error: ERROR_NUEVA_ESPACIOS, campo: "nueva" };
  if (celular && soloDigitos(nueva) === celular && nueva.trim() === celular) {
    return { ok: false, error: ERROR_NUEVA_IGUAL_CELULAR, campo: "nueva" };
  }
  if (confirmacion !== nueva) return { ok: false, error: ERROR_CONFIRMACION, campo: "confirmacion" };
  return { ok: true, datos: { actual, nueva } };
}
