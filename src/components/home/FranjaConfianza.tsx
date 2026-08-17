import clsx from "clsx";
import { NEGOCIO } from "@/config/negocio";
import {
  IconoCalendario3D,
  IconoCaja3D,
  IconoFoto3D,
  IconoUbicacion3D,
  IconoFactura3D,
} from "@/components/Iconos3D";

interface SenalCasa {
  ComponenteIcono: React.ComponentType<{ className?: string }>;
  cifra?: string;
  linea1Dorado: string;
  linea2Blanco: string;
  claseFondo: string;
}

export function FranjaConfianza({
  piezasNuevas,
  piezasUsadas,
}: {
  piezasNuevas: number | null;
  piezasUsadas: number | null;
}) {
  const fmt = (n: number) => n.toLocaleString("es-MX");

  const senales: SenalCasa[] = [
    {
      ComponenteIcono: IconoCalendario3D,
      cifra: "40+",
      linea1Dorado: "AÑOS",
      linea2Blanco: "EN MONTERREY",
      claseFondo: "bg-[#1d1f25]",
    },
    {
      ComponenteIcono: IconoCaja3D,
      cifra: piezasNuevas ? fmt(piezasNuevas) : "41,948",
      linea1Dorado: "",
      linea2Blanco: "PIEZAS NUEVAS",
      claseFondo: "bg-gradient-to-r from-[#6b501c] via-[#5c4417] to-[#4c3711]",
    },
    {
      ComponenteIcono: IconoFoto3D,
      cifra: piezasUsadas ? fmt(piezasUsadas) : "17,289",
      linea1Dorado: "",
      linea2Blanco: "USADAS CON FOTO REAL",
      claseFondo: "bg-[#1d1f25]",
    },
    {
      ComponenteIcono: IconoUbicacion3D,
      cifra: String(NEGOCIO.sucursales.length || "2"),
      linea1Dorado: "SUCURSALES",
      linea2Blanco: "— RECOGE HOY",
      claseFondo: "bg-[#19222c]",
    },
    {
      ComponenteIcono: IconoFactura3D,
      cifra: "",
      linea1Dorado: "FACTURAMOS",
      linea2Blanco: "CFDI 4.0",
      claseFondo: "bg-[#0b2042]",
    },
  ];

  return (
    <section
      aria-label="Datos de la casa"
      // Translúcida a propósito: el carrusel de la vitrina corre por DETRÁS de
      // esta tira, así que la foto sigue viéndose y las dos zonas se leen como
      // una sola. El velo oscuro es lo que sostiene el contraste del texto; un
      // color sólido cortaba la foto en seco a media pantalla.
      className="sobre-plano relative border-t border-white/10 bg-plano-hondo/70 text-white backdrop-blur-[2px]"
    >
      <div className="mx-auto max-w-7xl">
        <ul className="grid grid-cols-2 divide-x divide-white/10 sm:grid-cols-3 lg:grid-cols-5">
          {senales.map((s) => (
            <li
              key={s.linea2Blanco}
              className={clsx(
                "flex items-center gap-4 px-4 py-4 transition-opacity hover:opacity-95",
                s.claseFondo
              )}
            >
              <div className="shrink-0 drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]">
                <s.ComponenteIcono className="size-11" />
              </div>
              <div className="min-w-0 leading-tight">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  {s.cifra && (
                    <span className="num-tab font-display text-[21px] font-extrabold tracking-tight text-[#f0d97d]">
                      {s.cifra}
                    </span>
                  )}
                  {s.linea1Dorado && (
                    <span className="rotulo-tecnico text-[12px] font-extrabold tracking-wider text-[#f0d97d]">
                      {s.linea1Dorado}
                    </span>
                  )}
                </div>
                <div className="rotulo-tecnico text-[11px] font-extrabold tracking-wide text-white mt-0.5">
                  {s.linea2Blanco}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
