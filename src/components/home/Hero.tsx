import Link from "next/link";
import { Layers, Tag, Truck } from "lucide-react";
import type { Marca, TipoParte } from "@/lib/catalogo";
import { SelectorVehiculo } from "@/components/SelectorVehiculo";
import { MuroPiezas } from "@/components/home/MuroPiezas";

// HERO de la home: letrero corto y buscador, nada más. Mide la mitad de lo que
// medía a propósito — esto es una refaccionaria, no una portada de agencia: la
// mercancía con precio tiene que alcanzar a asomarse en la primera pantalla.
// El fondo sigue siendo foto REAL del catálogo fundida en grafito (MuroPiezas),
// el buscador es lo más brillante de la pantalla, y a la derecha van tres
// señales de venta en lista plana. Se retiró el abanico de fichas rotadas: se
// leía como portafolio de diseñador, no como mostrador.

export interface TipoPopular {
  id: number;
  nombre: string;
}

/** Ficha del abanico que vestía el hero. El abanico ya no se dibuja, pero la
 *  home sigue armando y mandando `pila`: el tipo se conserva para no romper esa
 *  llamada mientras se limpia `page.tsx`. */
export interface PiezaPila {
  etiqueta: string;
  codigo: string;
}

/** Lo que un cliente quiere saber antes de teclear la marca de su coche. Texto
 *  corto e icono neutro: aquí no hay nada que tocar, así que no hay ámbar. */
const SENALES_VENTA = [
  { Icono: Tag, texto: "Precio con IVA a la vista" },
  { Icono: Layers, texto: "Nuevas, usadas y sobre pedido" },
  { Icono: Truck, texto: "Recoge hoy en Monterrey o te la enviamos" },
] as const;

export function Hero({
  marcas,
  tipos,
  subtitulo,
  populares,
  codigosMuro,
}: {
  marcas: Marca[];
  tipos: TipoParte[];
  subtitulo: string;
  populares: TipoPopular[];
  /** Códigos con foto verificada para el muro del fondo. */
  codigosMuro: string[];
  /** Alimentaba el abanico de fichas; ya no se usa. Se mantiene en la firma
   *  para que la home actual siga compilando. */
  pila?: PiezaPila[];
}) {
  return (
    <section className="sobre-grafito relative isolate overflow-hidden bg-grafito-hondo text-white">
      <MuroPiezas codigos={codigosMuro} />
      <span aria-hidden className="velo-hero absolute inset-0" />

      <div className="relative mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="grid items-center gap-6 md:grid-cols-[1.15fr_0.85fr] md:gap-10">
          <div>
            <p className="flex items-center gap-2.5">
              <span aria-hidden className="h-px w-7 shrink-0 bg-white/35" />
              <span className="rotulo text-white/70">
                Refacciones de colisión · Monterrey
              </span>
            </p>

            {/* Interlineado 1.06 (no el 0.98 de .titulo-cartel): la placa ámbar
                mide ~1.15em y con el interlineado cerrado pisaría el renglón de
                arriba cuando el título parte en dos. */}
            <h1 className="titulo-cartel mt-3 text-[clamp(1.9rem,4.2vw,3rem)] leading-[1.06]">
              ¿Chocaste? Tenemos <span className="placa-ambar">tu pieza</span>.
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-snug text-slate-300 md:text-[15px]">
              {subtitulo}
            </p>
          </div>

          {/* En móvil estas señales estorbarían entre el título y el buscador;
              ahí las levanta la franja de confianza que va abajo del hero. */}
          <ul className="carta-oscura hidden divide-y divide-white/10 md:block">
            {SENALES_VENTA.map(({ Icono, texto }) => (
              <li key={texto} className="flex items-center gap-3 px-4 py-3">
                <Icono aria-hidden className="size-4 shrink-0 text-slate-400" />
                <span className="text-[13px] font-medium leading-snug text-slate-100">
                  {texto}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5">
          <SelectorVehiculo marcas={marcas} tipos={tipos} tono="oscuro" />
        </div>

        {populares.length > 0 && (
          <p className="mt-3 flex flex-wrap items-center gap-2 px-1 text-sm text-slate-400">
            <span className="rotulo text-white/50">Lo más buscado</span>
            {populares.map((p) => (
              <Link
                key={p.id}
                href={`/refacciones?parte=${p.id}`}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-wide text-slate-200 transition-colors duration-150 hover:border-white/40 hover:text-white"
              >
                {p.nombre}
              </Link>
            ))}
          </p>
        )}
      </div>
    </section>
  );
}
