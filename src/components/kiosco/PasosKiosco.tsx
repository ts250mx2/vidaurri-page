"use client";

import { usePathname } from "next/navigation";
import clsx from "clsx";
import { RUTA_KIOSCO, RUTA_KIOSCO_LISTO, RUTA_KIOSCO_PEDIDO } from "@/lib/kiosco/rutas";

// Los tres pasos del kiosco, siempre a la vista en la barra: el cliente sabe
// dónde está y cuánto le falta. NO son enlaces —en el kiosco no se navega con
// el ratón por gusto, se avanza con el botón de cada pantalla— así que se
// pintan como rótulos, no como botones que invitan a clicar.
//
// El paso actual va en blanco, no en ámbar: en esta pantalla el ámbar es de la
// acción (Agregar, Continuar, Enviar) y un "dónde estás" del mismo color le
// quitaría al botón el único color que lo hace inconfundible.

const PASOS = [
  { ruta: RUTA_KIOSCO, texto: "Busca tu pieza" },
  { ruta: RUTA_KIOSCO_PEDIDO, texto: "Tus datos" },
  { ruta: RUTA_KIOSCO_LISTO, texto: "Tu folio" },
] as const;

export function PasosKiosco() {
  const pathname = usePathname();
  const actual = PASOS.findIndex((paso) => paso.ruta === pathname);
  // En activar y salir (pantallas del personal) no hay pasos que enseñar.
  if (actual < 0) return null;

  return (
    <ol className="flex items-center gap-2" aria-label="Pasos del pedido">
      {PASOS.map((paso, i) => {
        const hecho = i < actual;
        const aqui = i === actual;
        return (
          <li key={paso.ruta} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden className="h-px w-5 bg-white/25" />}
            <span
              aria-current={aqui ? "step" : undefined}
              className={clsx(
                "rotulo-tecnico flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-colors duration-150",
                aqui && "bg-white text-plano-hondo",
                hecho && "text-white/70",
                !aqui && !hecho && "text-white/40"
              )}
            >
              <span
                aria-hidden
                className={clsx(
                  "num-tab grid size-5 place-items-center rounded-full font-mono text-[11px]",
                  aqui ? "bg-plano-hondo/15 text-plano-hondo" : "border border-current"
                )}
              >
                {i + 1}
              </span>
              {paso.texto}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
