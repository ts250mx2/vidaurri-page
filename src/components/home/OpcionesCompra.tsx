import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LinkChat } from "@/components/home/LinkChat";

// Las tres columnas de opción de una valuación: la misma pieza puede salir
// nueva de anaquel, sobre pedido o usada, y el cliente elige por precio. Va como
// UNA tabla de decisión —una sola lámina partida por filetes, con los mismos
// renglones en las tres columnas para poder compararlas— y no como tres
// tarjetas con icono, que es lo que oculta las diferencias en vez de mostrarlas.
//
// Los renglones son los que un comprador de refacción realmente pregunta, y la
// letra chica se dice completa: no se promete fecha de lo que está sobre pedido,
// no se inventan descuentos y el precio siempre lo da el catálogo o Vico.

const CLASE_CTA =
  "rotulo-tecnico inline-flex min-h-11 items-center gap-1.5 text-[13px] text-tinta underline-offset-4 hover:underline";

/** Renglones de la tabla, iguales en las tres columnas: sin eso no se comparan. */
const RENGLONES = ["Cuándo", "Precio", "Letra chica"] as const;

interface Opcion {
  clave: string;
  titulo: string;
  /** Sello de goma: solo cuando es verdad (existencia real, pieza única). */
  sello?: { clase: string; texto: string };
  promesa: string;
  valores: readonly [string, string, string];
  cta: React.ReactNode;
  /** Microcopy de expectativa: obligatorio bajo todo CTA de conversación. */
  micro?: string;
}

const OPCIONES: Opcion[] = [
  {
    clave: "nueva",
    titulo: "Nueva, en anaquel",
    sello: { clase: "sello-existencia", texto: "En existencia" },
    promesa: "Está en la bodega: pagas y te la llevas el mismo día.",
    valores: [
      "Hoy mismo, la recoges en sucursal.",
      "El del catálogo, con IVA incluido.",
      "Sujeta a existencia al momento de la compra.",
    ],
    cta: (
      <Link href="/refacciones" className={CLASE_CTA}>
        Busca tu pieza
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    ),
  },
  {
    clave: "pedido",
    titulo: "Sobre pedido",
    promesa: "No está en piso hoy, pero te la conseguimos.",
    valores: [
      "Te confirmamos la disponibilidad al cotizar.",
      "El mismo precio que la pieza nueva.",
      "No te damos fecha hasta tenerla confirmada.",
    ],
    cta: (
      <LinkChat mensaje="Hola, necesito una pieza sobre pedido. Mi auto es: ">
        Pídesela a Vico
        <ArrowRight aria-hidden className="size-4" />
      </LinkChat>
    ),
    micro: "El asistente cotiza 24/7 y te pasa con una persona cuando lo pidas.",
  },
  {
    clave: "usada",
    titulo: "Usada, con foto real",
    sello: { clase: "sello-unica", texto: "Pieza única" },
    promesa: "Pieza original de una sola unidad, con su foto de verdad.",
    valores: [
      "Hoy, si sigue disponible.",
      "El de esa pieza en particular, con IVA incluido.",
      "Es única: la foto que ves es la que te llevas.",
    ],
    cta: (
      <Link href="/usadas" className={CLASE_CTA}>
        Mira las usadas
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    ),
  },
];

export function OpcionesCompra() {
  return (
    <section aria-labelledby="opciones-titulo" className="bg-papel">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-linea-fuerte pb-3">
          <h2
            id="opciones-titulo"
            className="rotulo-tecnico text-[clamp(1.15rem,2.6vw,1.5rem)] leading-none text-tinta"
          >
            Tres formas de conseguir la misma pieza
          </h2>
          <p className="text-[13px] text-tinta-suave">
            Todos los precios con IVA incluido
          </p>
        </div>

        <ul className="lamina mt-5 grid divide-y divide-linea overflow-hidden md:grid-cols-3 md:divide-x md:divide-y-0">
          {OPCIONES.map((o) => (
            <li key={o.clave} className="flex flex-col">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-linea bg-papel px-4 py-3">
                <h3 className="rotulo-tecnico text-[15px] text-tinta">
                  {o.titulo}
                </h3>
                {/* `bg-hoja`: el sello siempre sobre papel blanco, para que la
                    tinta verde y la roja pasen el contraste de cuerpo. */}
                {o.sello && (
                  <span className={`sello ${o.sello.clase} bg-hoja`}>
                    {o.sello.texto}
                  </span>
                )}
              </div>

              <p className="px-4 pt-4 text-[14px] leading-relaxed text-tinta">
                {o.promesa}
              </p>

              <dl className="mt-4 flex-1 divide-y divide-linea border-t border-linea text-[13px]">
                {RENGLONES.map((renglon, i) => (
                  <div key={renglon} className="flex gap-3 px-4 py-2.5">
                    <dt className="rotulo-tecnico w-[5.25rem] shrink-0 text-[11px] leading-tight text-tinta-suave">
                      {renglon}
                    </dt>
                    <dd className="min-w-0 flex-1 leading-snug text-tinta-suave">
                      {o.valores[i]}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="border-t border-linea px-4 py-3.5">
                {o.cta}
                {o.micro && (
                  <p className="mt-1.5 max-w-[42ch] text-[12px] leading-snug text-tinta-suave">
                    {o.micro}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
