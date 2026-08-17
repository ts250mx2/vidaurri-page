import Link from "next/link";
import { ArrowRight, Camera, PackageSearch, Store } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LinkChat } from "@/components/home/LinkChat";

// Las tres formas de resolver el golpe: nueva en existencia (recoge hoy), usada
// con foto real (ahorro, pieza única) y sobre pedido (la conseguimos a precio
// de nueva). Sin precios inventados: el precio lo da el catálogo o Vico.
//
// Va como UNA sola tabla de tres columnas partida por filetes —no tres tarjetas
// sueltas con aire— y el beneficio manda sobre la etiqueta: primero qué ganas,
// después el detalle. Encabezado de un renglón, sin descripción: lo que vende
// aquí es el trato, no el titular.

const CLASE_CTA =
  "inline-flex min-h-11 items-center gap-1.5 font-display text-sm font-bold uppercase tracking-wide text-tinta underline-offset-4 hover:underline";

interface Opcion {
  icono: LucideIcon;
  /** Etiqueta de anaquel (el tipo de compra). */
  rotulo: string;
  /** Titular: el beneficio, no el nombre del producto. */
  titulo: string;
  texto: string;
  cta: React.ReactNode;
}

const OPCIONES: Opcion[] = [
  {
    icono: Store,
    rotulo: "Nueva",
    titulo: "Recógela hoy en sucursal",
    texto:
      "Pieza nueva en anaquel, con el precio con IVA a la vista. Pagas y te la llevas el mismo día.",
    cta: (
      <Link href="/refacciones" className={CLASE_CTA}>
        Busca tu pieza nueva
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    ),
  },
  {
    icono: Camera,
    rotulo: "Usada",
    titulo: "Ahorra con pieza original",
    texto:
      "La foto que ves es de la pieza exacta que te llevas. Cada usada es única.",
    cta: (
      <Link href="/usadas" className={CLASE_CTA}>
        Mira las usadas
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    ),
  },
  {
    icono: PackageSearch,
    rotulo: "Sobre pedido",
    titulo: "Te la conseguimos",
    texto:
      "¿No la ves en el catálogo? Dinos qué ocupas: te la conseguimos a precio de pieza nueva.",
    cta: (
      <LinkChat
        mensaje="Hola, necesito una pieza sobre pedido. Mi auto es: "
        className="min-h-11"
      >
        Pídesela a Vico
        <ArrowRight aria-hidden className="size-4" />
      </LinkChat>
    ),
  },
];

export function OpcionesCompra() {
  return (
    <section aria-labelledby="opciones-titulo" className="bg-fondo">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <h2
          id="opciones-titulo"
          className="titulo-display text-xl text-tinta md:text-[1.375rem]"
        >
          Tres formas de resolver el golpe
        </h2>

        <ul className="carta mt-4 grid divide-y divide-borde overflow-hidden md:grid-cols-3 md:divide-x md:divide-y-0">
          {OPCIONES.map((o) => (
            <li key={o.rotulo} className="flex flex-col p-5">
              <p className="flex items-center gap-2">
                <o.icono aria-hidden className="size-4 shrink-0 text-tinta-suave" />
                <span className="rotulo text-tinta-suave">{o.rotulo}</span>
              </p>
              <h3 className="titulo-display mt-2 text-lg text-tinta">{o.titulo}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-tinta-suave">
                {o.texto}
              </p>
              <p className="mt-2.5">{o.cta}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
