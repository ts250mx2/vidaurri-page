import Link from "next/link";
import { X } from "lucide-react";

// Pill de vehiculo activa: barra sticky bajo el header (h-16 + filo ambar de
// 4px = 68px) con el chip "NISSAN VERSA 2016 ✕" y el conteo de resultados.
// La ✕ regresa al catalogo completo (/refacciones).

export function PillVehiculo({
  etiqueta,
  total,
}: {
  /** Vehículo activo, p. ej. "Nissan Versa 2016". */
  etiqueta: string;
  total: number;
}) {
  const conteo =
    total === 1
      ? "1 pieza encontrada"
      : `${total.toLocaleString("es-MX")} piezas encontradas`;

  return (
    // Grafito, no blanco: pegada bajo el header oscuro y sobre el encabezado
    // grafito de la página, una franja blanca aquí partiría el mástil en dos.
    <div className="sobre-grafito sticky top-[68px] z-40 bg-grafito/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
        <span className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-white/10 py-1 pl-3.5 pr-1 font-display text-sm font-bold uppercase tracking-[0.06em] text-white">
          {etiqueta}
          <Link
            href="/refacciones"
            aria-label={`Quitar el filtro de vehículo ${etiqueta}`}
            className="flex size-7 items-center justify-center rounded-md transition-colors duration-150 hover:bg-white/15"
          >
            <X aria-hidden className="size-3.5" />
          </Link>
        </span>
        <span className="num-tab text-sm text-slate-400">{conteo}</span>
      </div>
    </div>
  );
}
