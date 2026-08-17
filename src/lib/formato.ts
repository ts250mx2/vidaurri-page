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

/** Rango de años de aplicacion: "2015–2019", "2015" o "" si no hay dato. */
export function rangoAnios(aini: number | null, afin: number | null): string {
  if (aini && afin) return aini === afin ? String(aini) : `${aini}–${afin}`;
  if (aini) return `${aini}+`;
  if (afin) return `hasta ${afin}`;
  return "";
}
