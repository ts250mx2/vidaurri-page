import clsx from "clsx";

// Encabezado de sección: rotulado del plano y un filete fino que lo separa de
// lo que viene abajo, como el renglón de título de una lámina. Es el mismo
// objeto gráfico en todo el sitio, así el ritmo de las páginas se lee como un
// sistema y no como una suma de bloques sueltos.
//
// Aquí NO hay etiqueta-rótulo sobre el título: el título carga solo. La prop
// `rotulo` sigue declarada para no romper a quien todavía la pasa, pero no se
// renderiza.
//
// Nunca lleva ámbar: el ámbar solo aparece donde hay algo que tocar.

export function TituloSeccion({
  titulo,
  descripcion,
  accion,
  tono = "claro",
  como: Como = "h2",
  className,
}: {
  /** Ignorada. Resto del mundo anterior; ya no se renderiza. */
  rotulo?: string;
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
        "border-b pb-4",
        oscuro ? "border-white/20" : "border-linea-fuerte",
        className
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div className="min-w-0">
          <Como
            className={clsx(
              "rotulo-tecnico text-[clamp(1.5rem,3.4vw,2.05rem)] leading-[1.05]",
              oscuro ? "text-white" : "text-tinta"
            )}
          >
            {titulo}
          </Como>

          {descripcion && (
            <p
              className={clsx(
                "mt-3 max-w-[68ch] text-[15px] leading-relaxed",
                oscuro ? "text-white/75" : "text-tinta-suave"
              )}
            >
              {descripcion}
            </p>
          )}
        </div>

        {accion && <div className="shrink-0 sm:pb-1">{accion}</div>}
      </div>
    </div>
  );
}
