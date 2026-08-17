import Link from "next/link";
import type { Marca, TipoParte } from "@/lib/catalogo";
import { SelectorVehiculo } from "@/components/SelectorVehiculo";
import { TarjetaVico } from "@/components/home/TarjetaVico";
import { IndicadoresVitrina } from "@/components/home/Vitrina";
import {
  IconoClipboardGold3D,
  IconoCajaGold3D,
  IconoPinGold3D,
} from "@/components/Iconos3D";

/** Las tres razones principales en panel de cristal con iconos 3D dorados */
const SENALES = [
  {
    ComponenteIcono: IconoClipboardGold3D,
    linea1: "PRECIO CON IVA",
    linea2: "A LA VISTA",
  },
  {
    ComponenteIcono: IconoCajaGold3D,
    linea1: "NUEVAS, USADAS",
    linea2: "Y SOBRE PEDIDO",
  },
  {
    ComponenteIcono: IconoPinGold3D,
    linea1: "RECOGE HOY EN",
    linea2: "MONTERREY O TE LA ENVIAMOS",
  },
] as const;

export function Hero({
  marcas,
  tipos,
  subtitulo,
  populares,
}: {
  marcas: Marca[];
  tipos: TipoParte[];
  subtitulo: string;
  populares: Array<{ id: number; nombre: string }>;
}) {
  return (
    <section
      aria-labelledby="hero-titulo"
      className="sobre-plano relative text-white"
    >
      {/* Sin fondo propio: el carrusel vive en el contenedor de la vitrina
          (page.tsx) para que la MISMA foto corra por detrás del hero y de la
          tira de credenciales, en vez de cortarse entre los dos.

          El padding superior no es respiro, es mecánica: el header flota
          (position: absolute) y no reserva espacio en el flujo, así que sin
          esto la cinta y la navegación se comen el titular y los dos primeros
          campos del buscador. Cinta + nav + filo ≈ 103px desde `sm`; en móvil
          la cinta no se pinta y bastan ~70px. */}
      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-[84px] sm:pt-[124px] md:pb-12 md:pt-[128px]">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_auto_minmax(0,22rem)] lg:gap-8">
          {/* Columna 1 — Titular principal */}
          <div className="flex flex-col justify-start pt-1">
            <h1
              id="hero-titulo"
              className="titulo-lamina sombra-lectura flex flex-col items-start font-extrabold uppercase leading-[1.05] tracking-tight text-white text-3xl sm:text-4xl lg:text-[3.2rem]"
            >
              <span>¿CHOCASTE?</span>
              <span className="mt-2 flex flex-wrap items-center gap-2.5">
                <span>TENEMOS</span>
                <span className="marco-oro text-[#f0d97d]">TU PIEZA.</span>
              </span>
            </h1>

            <p className="mt-5 max-w-[42ch] text-[14.5px] leading-relaxed text-white/80">
              {subtitulo}
            </p>

            {/* Indicadores del carrusel: aquí, bajo el subtítulo, donde hay
                foto libre. Al pie del bloque caían encima de la última
                credencial de la tira y la tapaban. */}
            <IndicadoresVitrina className="mt-6 self-start" />
          </div>

          {/* Columna 2 — Panel vertical de cristal ajustado a la altura alineada */}
          <div className="panel-vitrina flex flex-col justify-around gap-4 rounded-2xl border border-white/20 bg-gradient-to-b from-white/10 to-black/40 p-4.5 shadow-2xl backdrop-blur-lg lg:w-[215px] lg:self-stretch">
            {SENALES.map(({ ComponenteIcono, linea1, linea2 }) => (
              <div key={linea1 + linea2} className="flex items-center gap-3.5">
                <div className="shrink-0 drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]">
                  <ComponenteIcono className="size-11" />
                </div>
                <div className="rotulo-tecnico text-[11.5px] font-bold leading-snug tracking-wider text-white">
                  <div>{linea1}</div>
                  <div>{linea2}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Columna 3 — Buscador de vehículo y Tarjeta Vico */}
          <div className="flex flex-col gap-2.5">
            <SelectorVehiculo
              marcas={marcas}
              tipos={tipos}
              tono="oscuro"
              compacto
            />
            <TarjetaVico />
          </div>
        </div>

        {/* Lo más buscado */}
        {populares.length > 0 && (
          <nav
            aria-label="Tipos de pieza más buscados"
            className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-white/10 pt-4"
          >
            <span className="mr-2 text-[13px] font-medium text-white/70">Lo más buscado:</span>
            {populares.map((p) => (
              <Link
                key={p.id}
                href={`/refacciones?parte=${p.id}`}
                className="inline-flex items-center rounded-md border border-white/30 bg-white/10 px-3.5 py-1.5 font-display text-[11.5px] font-bold uppercase tracking-wider text-white transition-all duration-150 hover:border-white hover:bg-white/20"
              >
                {p.nombre}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </section>
  );
}
