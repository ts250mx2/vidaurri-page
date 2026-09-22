// El domicilio del cliente en el pedido, tal como lo captura el formulario
// (`FormularioDomicilio`) y como viaja a IA en `POST /borrador/enviar`
// (`domicilio`). Copia del contrato de vidaurri-ia (`Domicilio` en
// pedidos.ts): mismos campos, mismos topes, misma regla de "todo o nada".
// Puro, sin base ni navegador: lo usan componentes de cliente y de servidor.

export interface Domicilio {
  /** Calle y número (exterior e interior, como lo diga el cliente). */
  calle: string;
  colonia: string;
  /** Cinco dígitos. */
  cp: string;
  municipio: string;
  estado: string;
  /** Teléfono de contacto en ese domicilio; en el formulario va como se teclea ("81 1234 5678"), al pedido solo dígitos. */
  telefono: string | null;
}

export const DOMICILIO_VACIO: Domicilio = { calle: "", colonia: "", cp: "", municipio: "", estado: "", telefono: null };
const TELEFONO_DIGITOS = 10;

export const DOMICILIO_MAX = { calle: 120, colonia: 80, municipio: 80, estado: 60 } as const;

const ES_CP = /^\d{5}$/;

/** El CP como se teclea: solo dígitos, a lo más cinco. */
export function cpTecleado(valor: string): string {
  return valor.replace(/\D/g, "").slice(0, 5);
}

export function esCpCompleto(cp: string): boolean {
  return ES_CP.test(cp);
}

/** true si no se tecleó nada en ningún campo. */
export function domicilioVacio(d: Domicilio): boolean {
  return Object.values(d).every((v) => !v || !v.trim());
}

/**
 * null si está vacío (no se manda), el domicilio recortado si está completo,
 * o el texto del error si se tecleó algo pero falta un campo o el CP no son
 * cinco dígitos. Es la misma regla que aplica IA (`validarDomicilio`): se
 * repite aquí para que el error salga al instante y no tras el viaje.
 */
export function validarDomicilio(d: Domicilio): { ok: true; domicilio: Domicilio | null } | { ok: false; error: string } {
  const limpio: Domicilio = {
    calle: d.calle.trim().slice(0, DOMICILIO_MAX.calle),
    colonia: d.colonia.trim().slice(0, DOMICILIO_MAX.colonia),
    cp: d.cp.trim(),
    municipio: d.municipio.trim().slice(0, DOMICILIO_MAX.municipio),
    estado: d.estado.trim().slice(0, DOMICILIO_MAX.estado),
    telefono: d.telefono?.replace(/\D/g, "") || null,
  };
  if (domicilioVacio(limpio)) return { ok: true, domicilio: null };
  if (!esCpCompleto(limpio.cp)) return { ok: false, error: "El código postal son 5 dígitos" };
  if (!limpio.calle) return { ok: false, error: "Falta la calle y el número del domicilio" };
  if (!limpio.colonia) return { ok: false, error: "Falta la colonia del domicilio" };
  if (!limpio.municipio || !limpio.estado) return { ok: false, error: "Falta el municipio o el estado del domicilio" };
  if (limpio.telefono !== null && limpio.telefono.length !== TELEFONO_DIGITOS) {
    return { ok: false, error: "El teléfono de contacto del domicilio son 10 dígitos" };
  }
  return { ok: true, domicilio: limpio };
}

/** "81 1234 5678" a partir de los 10 dígitos; cualquier otra cosa se deja como viene. */
function telefonoLegible(telefono: string): string {
  const digitos = telefono.replace(/\D/g, "");
  if (digitos.length !== TELEFONO_DIGITOS) return telefono;
  return `${digitos.slice(0, 2)} ${digitos.slice(2, 6)} ${digitos.slice(6)}`;
}

/** "Av. Ruiz Cortines 1234, Mitras Centro, 64460 Monterrey, Nuevo León · Tel. 81 1234 5678". */
export function textoDomicilio(d: Domicilio): string {
  const base = `${d.calle}, ${d.colonia}, ${d.cp} ${d.municipio}, ${d.estado}`;
  return d.telefono ? `${base} · Tel. ${telefonoLegible(d.telefono)}` : base;
}

/** Lo que ya se tecleó, para enseñarlo con el bloque colapsado aunque falte algo. */
export function resumenDomicilio(d: Domicilio): string {
  const partes = [d.calle, d.colonia, [d.cp, d.municipio].filter(Boolean).join(" "), d.estado]
    .map((p) => p.trim())
    .filter(Boolean);
  const tel = d.telefono?.trim();
  return [partes.join(", "), tel ? `Tel. ${telefonoLegible(tel)}` : ""].filter(Boolean).join(" · ");
}
