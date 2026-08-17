import clsx from "clsx";
import { pesos } from "@/lib/formato";

// El renglón de precio del despiece: la cifra es la cota que cierra la ficha,
// por eso va en el rotulado del plano (Archivo Narrow) con cifras tabulares,
// que es como se alinea una columna de precios. "IVA incluido" nunca se
// esconde en letra chica: es la promesa del mostrador y va pegada a la cifra.

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
    <span className={clsx("inline-flex flex-col items-start", className)}>
      <span
        className={clsx(
          "num-tab font-display font-bold leading-none tracking-[-0.01em] text-tinta",
          tam === "lg" ? "text-[clamp(2.1rem,5vw,2.75rem)]" : "text-[1.6rem]"
        )}
      >
        {pesos(monto)}
      </span>
      <span className="rotulo-tecnico mt-1.5 text-[11px] leading-none text-tinta-suave">
        IVA incluido
      </span>
    </span>
  );
}
