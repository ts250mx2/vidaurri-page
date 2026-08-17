import { FileText, Phone, Store } from "lucide-react";
import clsx from "clsx";
import { NEGOCIO, PRELLENADOS, urlWhatsApp } from "@/config/negocio";
import { BotonCotizar } from "@/components/BotonCotizar";
import { IconWhatsApp } from "@/components/IconWhatsApp";

// CTAs de la hoja de partida en ESCALERA, no en pila de iguales. Dos bloques
// llenos, del mismo alto y del mismo ancho, apilados uno sobre otro se leen
// como dos primarios y anulan la jerarquía de la casa: el ojo no sabe cuál
// tocar. Aquí cada rango cambia de RELLENO, TAMAÑO y ANCHO:
//
//   1º WhatsApp — lámina verde de ancho completo y la más alta. Es el canal.
//   2º chat de Vico — pastilla de oro compacta, del ancho de su texto. El oro
//      no se apaga (sigue siendo la acción de la casa), se ACHICA: un tercio
//      del área del verde.
//   3º llamar — renglón de enlace, con el número a la vista, sin caja.
//
// Sobre el verde y sobre el oro el texto va SIEMPRE en tinta oscura: el blanco
// sobre esos dos no llega al contraste mínimo, y esto se lee al sol.

const SENALES = [
  { icono: FileText, texto: "Facturamos CFDI 4.0" },
  // Sin plazo: "el mismo día" es una promesa de entrega que no está confirmada
  // y que además sería falsa en las piezas sobre pedido. El "hoy" solo se dice
  // donde es verdad: en el renglón de existencia del bloque de precio.
  { icono: Store, texto: "Recógela en sucursal, en Monterrey" },
];

export function CtasPieza({
  nombre,
  codigo,
  className,
}: {
  nombre: string;
  codigo: string;
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-col gap-4", className)}>
      <a
        href={urlWhatsApp(PRELLENADOS.pieza(nombre, codigo))}
        target="_blank"
        rel="noopener noreferrer"
        className="rotulo-tecnico flex min-h-14 items-center justify-center gap-2.5 rounded-md bg-whatsapp px-4 text-[15px] text-plano-hondo transition-[filter] duration-150 hover:brightness-95 active:brightness-90"
      >
        <IconWhatsApp lado={20} />
        Cotizar por WhatsApp
      </a>

      <div className="flex flex-col items-start">
        <BotonCotizar mensaje={`Quiero cotizar: ${nombre} (código ${codigo})`}>
          Cotizar por chat
        </BotonCotizar>
        <p className="mt-2 text-xs leading-snug text-tinta-suave">
          {NEGOCIO.asistente} te cotiza al momento, 24/7, con IVA incluido
        </p>
      </div>

      <a
        href={`tel:${NEGOCIO.telefono}`}
        className="group inline-flex min-h-11 flex-wrap items-center gap-x-2 gap-y-1 self-start text-sm text-tinta"
      >
        <Phone aria-hidden className="size-4 shrink-0 text-tinta-suave" />
        <span className="underline-offset-4 group-hover:underline">
          Llamar a sucursal
        </span>
        <span className="num-tab font-mono text-[13px] text-tinta-suave">
          {NEGOCIO.telefonoBonito}
        </span>
      </a>

      {/* En pantallas anchas esta columna se estrecha (el QR va a su lado):
          ahí las señales vuelven a un solo renglón por línea. */}
      <ul className="grid gap-2 border-t border-linea pt-4 text-[13px] text-tinta-suave sm:grid-cols-2 xl:grid-cols-1">
        {SENALES.map((s) => (
          <li key={s.texto} className="flex items-center gap-2">
            <s.icono aria-hidden className="size-4 shrink-0" />
            {s.texto}
          </li>
        ))}
      </ul>
    </div>
  );
}
