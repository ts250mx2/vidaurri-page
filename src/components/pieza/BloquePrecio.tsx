import { Precio } from "@/components/Precio";
import { pesos } from "@/lib/formato";
import type { PiezaUsadaResumen } from "@/lib/usadas";

// Bloque de precio de la ficha: precio con IVA en grande y renglones de
// disponibilidad. Urgencia solo real (dirección "Mostrador"): existencia
// local, usada equivalente con ahorro calculado o surtido sobre pedido.
// El filo ámbar izquierdo es la segunda licencia decorativa del ámbar en todo
// el sitio (la otra es el filo del header): marca dónde está el trato.

export function BloquePrecio({
  precioConIva,
  enExistencia,
  sobrePedido,
  usadas,
}: {
  precioConIva: number;
  enExistencia: boolean;
  sobrePedido: boolean;
  usadas: PiezaUsadaResumen[];
}) {
  const preciosUsadas = usadas
    .map((u) => u.precioConIva)
    .filter((p): p is number => typeof p === "number" && p > 0);
  const usadaDesde = preciosUsadas.length > 0 ? Math.min(...preciosUsadas) : null;
  const ahorro =
    usadaDesde !== null && precioConIva > 0 && usadaDesde < precioConIva
      ? Math.round(((precioConIva - usadaDesde) / precioConIva) * 100)
      : 0;
  const sinSenal = !enExistencia && usadas.length === 0 && !sobrePedido;

  return (
    <div className="carta overflow-hidden border-l-4 border-l-ambar">
      <div className="p-5">
        {precioConIva > 0 ? (
          <Precio monto={precioConIva} tam="lg" />
        ) : (
          <span className="titulo-cartel text-3xl">Pregunta el precio</span>
        )}
      </div>

      <ul className="divide-y divide-borde border-t border-borde text-sm">
        {enExistencia && (
          <li className="flex items-center gap-2.5 bg-fondo px-5 py-3.5 font-semibold text-exito">
            <span aria-hidden className="size-2 shrink-0 rounded-full bg-exito" />
            Nueva en existencia — recógela hoy en Monterrey
          </li>
        )}
        {usadas.length > 0 && (
          <li>
            <a
              href="#usadas"
              className="group flex items-center gap-2.5 px-5 py-3.5 font-semibold text-ambar-press transition-colors duration-150 hover:bg-fondo"
            >
              <span aria-hidden className="size-2 shrink-0 rounded-full bg-ambar" />
              <span className="num-tab">
                Usada disponible —{" "}
                {usadaDesde !== null && <>desde {pesos(usadaDesde)} · </>}
                {ahorro >= 1 && <>−{ahorro}% · </>}
                <span className="underline underline-offset-2 group-hover:no-underline">
                  ver fotos reales
                </span>
              </span>
            </a>
          </li>
        )}
        {sobrePedido && (
          <li className="flex items-center gap-2.5 px-5 py-3.5 text-tinta-suave">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-full border border-tinta-suave"
            />
            Sobre pedido — te decimos el plazo al cotizar
          </li>
        )}
        {sinSenal && (
          <li className="flex items-center gap-2.5 px-5 py-3.5 text-tinta-suave">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-full border border-tinta-suave"
            />
            Pregúntanos disponibilidad — la conseguimos
          </li>
        )}
      </ul>
    </div>
  );
}
