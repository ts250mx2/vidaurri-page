import Link from "next/link";
import { X } from "lucide-react";

// El renglón de vehículo activo: barra fija bajo el header con el vehículo
// filtrado y el conteo de partidas. Va en campo azul —pegada al header y sobre
// el cajetín de la página— porque una franja blanca aquí partiría el mástil.
//
// Alturas del header: 64px de banda + 4px de filo ámbar en móvil; en sm+ se
// suma la cinta utilitaria de 36px.

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
    <div className="sobre-plano sticky top-[68px] z-40 border-b border-white/15 bg-plano sm:top-[104px]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
        <span className="flex h-11 items-center gap-1 rounded-md border border-white/25 bg-white/10 pl-3.5">
          <span className="rotulo-tecnico text-sm text-white">{etiqueta}</span>
          <Link
            href="/refacciones"
            aria-label={`Quitar el filtro de vehículo ${etiqueta}`}
            className="flex size-11 items-center justify-center rounded-md text-white/75 transition-colors duration-150 hover:bg-white/15 hover:text-white"
          >
            <X aria-hidden className="size-4" />
          </Link>
        </span>
        <span className="num-tab text-sm text-white/70">{conteo}</span>
      </div>
    </div>
  );
}
