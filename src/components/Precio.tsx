import { pesos } from "@/lib/formato";
import clsx from "clsx";

// Precio con IVA en Barlow: la transparencia de "IVA incluido" es señal de
// confianza central de la direccion "Mostrador", así que nunca va en letra
// chica escondida — es una etiqueta con su propio peso bajo la cifra.

export function Precio({
  monto,
  tam = "md",
  className,
}: {
  monto: number;
  tam?: "md" | "lg";
  className?: string;
}) {
  return (
    <span className={clsx("inline-flex flex-col", className)}>
      <span
        className={clsx(
          "titulo-cartel num-tab text-tinta",
          tam === "lg" ? "text-[2.5rem]" : "text-2xl"
        )}
      >
        {pesos(monto)}
      </span>
      <span className="rotulo mt-0.5 text-tinta-suave">IVA incluido</span>
    </span>
  );
}
