import clsx from "clsx";
import { CLASE_TECLA } from "./estilos";

// La tecla dibujada junto a cada acción ("Enter", "Esc", "↑ ↓"). Es el manual
// del kiosco: no hay instrucciones que leer, el atajo se ve donde se usa.

export function Tecla({ children, className }: { children: React.ReactNode; className?: string }) {
  return <kbd className={clsx(CLASE_TECLA, className)}>{children}</kbd>;
}
