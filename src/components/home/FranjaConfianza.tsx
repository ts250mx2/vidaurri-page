import clsx from "clsx";
import { Boxes, Camera, FileText, History, Store } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { NEGOCIO } from "@/config/negocio";

// Tira de confianza de la home: los datos duros de la casa en UN renglón
// delgado, como el letrero de servicios que cuelga arriba del mostrador. No
// lleva encabezado: es señalización, no una sección.
//
// Las cifras salen de los resúmenes reales — null significa que la base no
// respondió y ese dato simplemente no entra, nunca se inventa. Las señales sin
// cifra son las que ya publica el sitio (factura CFDI 4.0 en el footer,
// /mayoreo y la ficha de pieza): aquí no se agrega ninguna promesa nueva.

interface SenalCasa {
  icono: LucideIcon;
  /** Número en Barlow al frente. Las señales sin cifra van solo con texto. */
  cifra?: string;
  texto: string;
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
    { icono: History, cifra: "40+", texto: "años en Monterrey" },
    ...(piezasNuevas
      ? [{ icono: Boxes, cifra: fmt(piezasNuevas), texto: "piezas nuevas" }]
      : []),
    ...(piezasUsadas
      ? [{ icono: Camera, cifra: fmt(piezasUsadas), texto: "usadas con foto real" }]
      : []),
    {
      icono: Store,
      cifra: String(NEGOCIO.sucursales.length),
      texto: "sucursales — recoge hoy",
    },
    { icono: FileText, texto: "Facturamos CFDI 4.0" },
  ];

  return (
    <section
      aria-label="Datos de la casa"
      className="border-y border-borde bg-superficie"
    >
      <div className="mx-auto max-w-6xl px-4">
        {/* Móvil: dos columnas con filete. Desktop: un solo renglón repartido en
            partes iguales, sin importar cuántas señales hayan sobrevivido. */}
        <ul className="grid grid-cols-2 md:flex md:items-stretch">
          {senales.map((s, i) => {
            const soloEnSuRenglon =
              senales.length % 2 === 1 && i === senales.length - 1;
            return (
              <li
                key={s.texto}
                className={clsx(
                  "flex items-center gap-2.5 py-4 md:min-w-0 md:flex-1",
                  i % 2 === 1 ? "border-l border-borde pl-4" : "pl-0",
                  i >= 2 && "border-t border-borde",
                  "md:border-t-0",
                  i === 0
                    ? "md:border-l-0 md:pl-0"
                    : "md:border-l md:border-borde md:pl-5",
                  soloEnSuRenglon && "col-span-2 md:col-span-1"
                )}
              >
                <s.icono aria-hidden className="size-4 shrink-0 text-tinta-suave" />
                <p className="min-w-0 leading-tight">
                  {s.cifra && (
                    <span className="titulo-display num-tab text-[17px] text-tinta">
                      {s.cifra}{" "}
                    </span>
                  )}
                  <span className="font-display text-[13px] font-semibold uppercase tracking-[0.06em] text-tinta-suave">
                    {s.texto}
                  </span>
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
