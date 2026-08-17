import clsx from "clsx";

// Monograma AV con el gradiente ambar-rojo del logo de Vidaurri: el puente de
// identidad entre la web publica (tema claro) y el sistema interno (oscuro).

export function LogoAV({ lado = 32 }: { lado?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-lg font-display font-bold text-grafito"
      style={{
        width: lado,
        height: lado,
        fontSize: lado * 0.45,
        background: "linear-gradient(135deg, #ffb400, #e5484d)",
      }}
    >
      AV
    </span>
  );
}

/** Lockup completo: monograma + razón comercial en dos renglones de Barlow.
 *  Es la firma de la casa en el header y el footer. */
export function MarcaAV({
  lado = 36,
  className,
}: {
  lado?: number;
  className?: string;
}) {
  return (
    <span className={clsx("flex items-center gap-2.5", className)}>
      <LogoAV lado={lado} />
      <span className="font-display font-bold uppercase leading-[0.98] tracking-[0.06em]">
        <span className="block text-[11px] font-semibold text-current opacity-65">
          Autopartes
        </span>
        <span className="block text-[17px]">Vidaurri</span>
      </span>
    </span>
  );
}
