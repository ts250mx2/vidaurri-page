import { slugificar } from "@/lib/slug";
import { SUCURSALES_ENTREGA, type SucursalEntrega } from "@/lib/mostrador/tipos";

// Funciones puras del kiosco: cómo se identifica el APARATO (su clave, su
// nombre, su sucursal) y cómo se validan los datos que teclea el CLIENTE antes
// de mandar el pedido. Sin dependencias de Next ni del navegador para que
// sirvan igual en el formulario, en los proxies y en el guardia de borde.
//
// La validación de aquí NO es la que manda: IA vuelve a validar todo con las
// mismas reglas (contrato §"Validación de los datos del cliente"). Esta solo
// existe para que el cliente vea el error mientras teclea, sin viaje al
// servidor, y para que un dato mal formado no salga siquiera de esta máquina.

/** Identificador del aparato tal como viaja en la cabecera `X-Kiosco`. */
export const RE_CLAVE_KIOSCO = /^[a-z0-9-]{1,30}$/;

export const NOMBRE_KIOSCO_MIN = 3;
export const NOMBRE_KIOSCO_MAX = 40;
export const NOMBRE_CLIENTE_MIN = 3;
export const NOMBRE_CLIENTE_MAX = 60;
export const TELEFONO_DIGITOS = 10;

export function esClaveKiosco(valor: unknown): valor is string {
  return typeof valor === "string" && RE_CLAVE_KIOSCO.test(valor);
}

export function esSucursalEntrega(valor: unknown): valor is SucursalEntrega {
  return typeof valor === "string" && SUCURSALES_ENTREGA.some((s) => s.clave === valor);
}

export function nombreSucursal(clave: SucursalEntrega): string {
  return SUCURSALES_ENTREGA.find((s) => s.clave === clave)?.nombre ?? clave;
}

/**
 * Clave del aparato a partir de su nombre ("Kiosco Matriz 1" → "kiosco-matriz-1").
 * null cuando el nombre no deja nada aprovechable (solo signos) o el slug se
 * pasa de 30 caracteres: más vale negarse a activar que mandar a IA una clave
 * que su guardia va a rechazar en cada llamada.
 */
export function claveDeKiosco(nombre: string): string | null {
  const clave = slugificar(nombre);
  return esClaveKiosco(clave) ? clave : null;
}

/** Espacios colapsados y recorte a los extremos: el mismo `limpiarTexto` de IA. */
export function limpiarTexto(valor: string): string {
  return valor.replace(/\s+/g, " ").trim();
}

/** Nombre del aparato ya limpio, o null si no cumple 3..40 tras limpiar. */
export function nombreKioscoValido(crudo: unknown): string | null {
  if (typeof crudo !== "string") return null;
  const nombre = limpiarTexto(crudo);
  return nombre.length >= NOMBRE_KIOSCO_MIN && nombre.length <= NOMBRE_KIOSCO_MAX ? nombre : null;
}

/** Solo los dígitos de lo que se tecleó (el cliente escribe guiones y espacios). */
export function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

/** Teléfono nacional legible mientras se teclea: "81 1234 5678". */
export function telefonoTecleado(valor: string): string {
  const digitos = soloDigitos(valor).slice(0, TELEFONO_DIGITOS);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 6) return `${digitos.slice(0, 2)} ${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)} ${digitos.slice(2, 6)} ${digitos.slice(6)}`;
}

export interface DatosCliente {
  nombre: string;
  telefono: string;
}

export type Validacion =
  | { ok: true; datos: DatosCliente }
  | { ok: false; error: string; campo: "nombre" | "telefono" };

export const ERROR_NOMBRE = "Escribe tu nombre completo (mínimo 3 letras)";
export const ERROR_TELEFONO = "Escribe tu celular a 10 dígitos, con la clave de tu ciudad";

/**
 * Los dos datos con los que el mostrador te va a hablar: nombre de 3 a 60
 * caracteres ya limpio y celular nacional de 10 dígitos. Devuelve el campo que
 * falla para que la pantalla lo señale y le ponga el foco.
 */
export function validarDatosCliente(nombreCrudo: string, telefonoCrudo: string): Validacion {
  const nombre = limpiarTexto(nombreCrudo);
  if (nombre.length < NOMBRE_CLIENTE_MIN || nombre.length > NOMBRE_CLIENTE_MAX) {
    return { ok: false, error: ERROR_NOMBRE, campo: "nombre" };
  }
  const telefono = soloDigitos(telefonoCrudo);
  if (telefono.length !== TELEFONO_DIGITOS) {
    return { ok: false, error: ERROR_TELEFONO, campo: "telefono" };
  }
  return { ok: true, datos: { nombre, telefono } };
}
