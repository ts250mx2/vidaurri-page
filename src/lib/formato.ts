// Formato de cifras de cara al cliente.

/** Pesos mexicanos: $2,450.00 */
export function pesos(monto: number): string {
  return monto.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** Fecha corta al estilo del mostrador: "2026-08-05" → "05-ago-2026".
 *  Devuelve "" si la fecha no viene o no es válida (fecha_alta en cero). */
export function fechaCorta(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  if (!m) return "";
  const mes = MESES_CORTOS[Number(m[2]) - 1];
  if (!mes || Number(m[1]) < 1990) return "";
  return `${m[3]}-${mes}-${m[1]}`;
}

/** Rango de años de aplicacion: "2015–2019", "2015" o "" si no hay dato. */
export function rangoAnios(aini: number | null, afin: number | null): string {
  if (aini && afin) return aini === afin ? String(aini) : `${aini}–${afin}`;
  if (aini) return `${aini}+`;
  if (afin) return `hasta ${afin}`;
  return "";
}
