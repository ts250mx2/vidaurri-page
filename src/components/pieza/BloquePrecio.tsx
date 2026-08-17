import { Camera, MessagesSquare, Package, Store } from "lucide-react";
import { Precio } from "@/components/Precio";
import { pesos } from "@/lib/formato";
import type { PiezaUsadaResumen } from "@/lib/usadas";

// EL RENGLÓN DE COTIZACIÓN de la hoja de partida: la cifra con IVA arriba y,
// debajo, los renglones de disponibilidad como una tabla de despiece.
//
// Aquí NO hay filo de color a la izquierda: en un plano nada se marca con una
// barra pintada. El énfasis viene del tamaño de la cifra y del sello de goma
// —que es una MARCA, se lee al sol y sobrevive a una impresión en blanco y
// negro—, no de un acento decorativo.
//
// Urgencia solo real: existencia en el anaquel, usada equivalente con su
// ahorro calculado o surtido sobre pedido. Nada más.

const CLASE_FILA = "flex min-h-12 items-center gap-3 px-5 py-3";

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
    <section aria-label="Precio y disponibilidad" className="lamina overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4 p-5">
        {precioConIva > 0 ? (
          <Precio monto={precioConIva} tam="lg" />
        ) : (
          <p className="titulo-lamina text-[clamp(1.5rem,3.6vw,2rem)] text-tinta">
            Pregunta el precio
          </p>
        )}

        {enExistencia ? (
          <span className="sello sello-existencia mt-2">En existencia</span>
        ) : (
          sobrePedido && (
            <span className="sello mt-2 text-tinta-suave">Sobre pedido</span>
          )
        )}
      </div>

      <ul className="divide-y divide-linea border-t border-linea text-sm">
        {enExistencia && (
          <li className={`${CLASE_FILA} bg-papel`}>
            <Store aria-hidden className="size-4 shrink-0 text-existencia" />
            <span className="text-tinta">
              <strong className="font-semibold">Nueva en existencia</strong> —
              recógela hoy en Monterrey
            </span>
          </li>
        )}

        {usadas.length > 0 && (
          <li>
            <a
              href="#usadas"
              className={`${CLASE_FILA} group text-tinta transition-colors duration-150 hover:bg-papel`}
            >
              <Camera aria-hidden className="size-4 shrink-0 text-anotacion" />
              <span>
                <strong className="font-semibold">La misma pieza, usada</strong>
                {usadaDesde !== null && (
                  <>
                    {" "}
                    <span className="num-tab font-mono">
                      desde {pesos(usadaDesde)}
                    </span>
                  </>
                )}
                {ahorro >= 1 && (
                  <>
                    {" "}
                    <span className="num-tab font-mono text-anotacion">
                      −{ahorro}%
                    </span>
                  </>
                )}{" "}
                ·{" "}
                <span className="underline underline-offset-4 group-hover:no-underline">
                  ver fotos reales
                </span>
              </span>
            </a>
          </li>
        )}

        {sobrePedido && (
          <li className={`${CLASE_FILA} text-tinta-suave`}>
            <Package aria-hidden className="size-4 shrink-0" />
            Sobre pedido — te decimos el plazo al cotizar
          </li>
        )}

        {sinSenal && (
          <li className={`${CLASE_FILA} text-tinta-suave`}>
            <MessagesSquare aria-hidden className="size-4 shrink-0" />
            Pregúntanos disponibilidad — la conseguimos
          </li>
        )}
      </ul>
    </section>
  );
}
