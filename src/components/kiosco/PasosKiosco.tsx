"use client";

import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useArea } from "./AreaContext";

// Los tres pasos del pedido, siempre a la vista en la barra: el cliente sabe
// dónde está y cuánto le falta. NO son enlaces —se avanza con el botón de
// cada pantalla— así que se pintan como rótulos, no como botones que invitan
// a clicar. Las rutas y el nombre del paso 2 ("Tus datos" en el kiosco,
// "Sucursal" en el área de clientes) salen del área.
//
// El paso actual va en blanco, no en ámbar: en esta pantalla el ámbar es de la
// acción (Agregar, Continuar, Enviar) y un "dónde estás" del mismo color le
// quitaría al botón el único color que lo hace inconfundible.

export function PasosKiosco({ className }: { className?: string }) {
  const pathname = usePathname();
  const area = useArea();
  const pasos = [
    { ruta: area.rutas.armar, texto: "Busca tu pieza" },
    { ruta: area.rutas.datos, texto: area.nombrePasoDatos },
    { ruta: area.rutas.listo, texto: "Tu folio" },
  ];
  const actual = pasos.findIndex((paso) => paso.ruta === pathname);
  // Fuera del flujo (entrar, mis pedidos, contraseña, activar) no hay pasos que enseñar.
  if (actual < 0) return null;

  return (
    <ol className={clsx("flex items-center gap-2", className)} aria-label="Pasos del pedido">
      {pasos.map((paso, i) => {
        const hecho = i < actual;
        const aqui = i === actual;
        return (
          <li key={paso.ruta} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden className="h-px w-5 bg-white/25" />}
            <span
              aria-current={aqui ? "step" : undefined}
              className={clsx(
                "rotulo-tecnico flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors duration-150",
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
