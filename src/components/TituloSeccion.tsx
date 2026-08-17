import clsx from "clsx";

// Encabezado de sección del "Mostrador": filo neutro + rótulo de anaquel + H2
// en Barlow. Es el mismo objeto gráfico en todo el sitio, así el ritmo de las
// páginas se lee como un sistema y no como una suma de bloques sueltos.
// Nunca lleva ámbar: el ámbar solo aparece donde hay algo que tocar.

export function TituloSeccion({
  rotulo,
  titulo,
  descripcion,
  accion,
  tono = "claro",
  como: Como = "h2",
  className,
}: {
  /** Etiqueta chica sobre el título (ej. "Catálogo"). */
  rotulo: string;
  titulo: React.ReactNode;
  descripcion?: React.ReactNode;
  /** Enlace o botón alineado a la derecha en desktop. */
  accion?: React.ReactNode;
  tono?: "claro" | "oscuro";
  /** Nivel real del encabezado (h1 en páginas que lo usan como título). */
  como?: "h1" | "h2";
  className?: string;
}) {
  const oscuro = tono === "oscuro";

  return (
    <div
      className={clsx(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8",
        className
      )}
    >
      <div className="max-w-2xl">
        <p className="flex items-center gap-2.5">
          <span
            aria-hidden
            className={clsx(
              "h-px w-7 shrink-0",
              oscuro ? "bg-white/35" : "bg-borde-fuerte"
            )}
          />
          <span
            className={clsx("rotulo", oscuro ? "text-white/60" : "text-tinta-suave")}
          >
            {rotulo}
          </span>
        </p>

        <Como
          className={clsx(
            "titulo-cartel mt-2.5 text-[clamp(1.9rem,4.4vw,2.9rem)]",
            oscuro ? "text-white" : "text-tinta"
          )}
        >
          {titulo}
        </Como>

        {descripcion && (
          <p
            className={clsx(
              "mt-2.5 text-[15px] leading-relaxed",
              oscuro ? "text-slate-300" : "text-tinta-suave"
            )}
          >
            {descripcion}
          </p>
        )}
      </div>

      {accion && <div className="shrink-0 sm:pb-1.5">{accion}</div>}
    </div>
  );
}
