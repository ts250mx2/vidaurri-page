import { useId } from "react";
import clsx from "clsx";

// La V de Vidaurri troquelada en oro: dos planos de metal que bajan a la punta,
// como el filo de una pieza de lámina. Sustituye al monograma cuadrado — el
// cliente fijó esta marca en su referencia — y conserva el oro de la casa.

export function LogoAV({ lado = 34 }: { lado?: number }) {
  // Los degradados se referencian por id y una página puede llevar varias V
  // (header + hoja impresa). Con ids repetidos, `url(#...)` resuelve siempre
  // al PRIMER <defs> del documento; si ese vive en un bloque display:none (el
  // header al imprimir la hoja de surtido) el degradado no se pinta y la V
  // sale vacía en el papel. useId da un id propio por instancia; se limpia
  // porque React lo rodea de caracteres inválidos en un fragmento de url().
  const base = `av${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const cara = `${base}-cara`;
  const canto = `${base}-canto`;
  const bisel = `${base}-bisel`;
  return (
    <svg
      width={lado}
      height={lado}
      viewBox="0 0 40 40"
      aria-hidden
      className="shrink-0"
    >
      <defs>
        {/* Cara iluminada: el brillo entra por arriba y muere hacia la punta. */}
        <linearGradient id={cara} x1="0.1" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#fdf3c8" />
          <stop offset="0.28" stopColor="#f0d97d" />
          <stop offset="0.62" stopColor="#d4af37" />
          <stop offset="1" stopColor="#9a7b1f" />
        </linearGradient>
        {/* Canto en sombra: el mismo metal visto de lado. */}
        <linearGradient id={canto} x1="1" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#d4af37" />
          <stop offset="0.5" stopColor="#a9821f" />
          <stop offset="1" stopColor="#6f5514" />
        </linearGradient>
        {/* Reflejo del bisel superior: la línea de luz sobre el corte. */}
        <linearGradient id={bisel} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff8dc" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="#f0d97d" stopOpacity="0.5" />
          <stop offset="1" stopColor="#f0d97d" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Ala izquierda: la cara ancha, la que recibe la luz. */}
      <path d="M3.5 5h9.6l8.2 21.4L17.2 35z" fill={`url(#${cara})`} />
      {/* Ala derecha: más delgada y en sombra, como el canto de una lámina. */}
      <path d="M36.5 5h-8.2L19.6 26.4 22.6 35z" fill={`url(#${canto})`} />
      {/* Bisel: la lumbre sobre el filo cortado del ala iluminada. */}
      <path d="M3.5 5h9.6l1 2.6H4.4z" fill={`url(#${bisel})`} />
      {/* Punta: el vértice donde las dos alas se encuentran, encendido. */}
      <path d="M17.2 35l2.4-6.4 3 6.4z" fill="#f0d97d" opacity="0.55" />
    </svg>
  );
}

/** Lockup completo: la V más la razón comercial en dos renglones de rotulado.
 *  Es la firma de la casa en el header y el footer, siempre sobre campo
 *  oscuro, así que hereda el color del contenedor (`text-current`). */
export function MarcaAV({
  lado = 34,
  className,
}: {
  lado?: number;
  className?: string;
}) {
  return (
    <span className={clsx("flex items-center gap-2.5", className)}>
      <LogoAV lado={lado} />
      <span className="font-display font-bold uppercase leading-[1] tracking-[0.05em]">
        <span className="block text-[11px] font-semibold text-current opacity-65">
          Autopartes
        </span>
        <span className="block text-[18px]">Vidaurri</span>
      </span>
    </span>
  );
}
