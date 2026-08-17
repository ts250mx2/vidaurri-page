import { FileText, Phone, Store } from "lucide-react";
import { NEGOCIO, PRELLENADOS, urlWhatsApp } from "@/config/negocio";
import { BotonCotizar } from "@/components/BotonCotizar";
import { IconWhatsApp } from "@/components/IconWhatsApp";

// CTAs de la ficha en la jerarquía "Mostrador": 1º WhatsApp (verde), 2º chat
// de Vico (ámbar), 3º llamar a sucursal (neutro). Nunca dos del mismo nivel
// juntos, y bajo los CTAs el microcopy de tiempos de respuesta.

const GARANTIAS = [
  { icono: FileText, texto: "Facturamos CFDI 4.0" },
  { icono: Store, texto: "Recoge en sucursal el mismo día" },
];

export function CtasPieza({ nombre, codigo }: { nombre: string; codigo: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      <a
        href={urlWhatsApp(PRELLENADOS.pieza(nombre, codigo))}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-whatsapp px-4 py-3.5 font-display text-sm font-bold uppercase tracking-wide text-white transition-opacity duration-150 hover:opacity-90"
      >
        <IconWhatsApp lado={18} />
        Cotizar por WhatsApp
      </a>

      <BotonCotizar
        mensaje={`Quiero cotizar: ${nombre} (código ${codigo})`}
        className="w-full"
      >
        Cotizar esta pieza por chat
      </BotonCotizar>

      <a
        href={`tel:${NEGOCIO.telefono}`}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-borde bg-superficie px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-tinta transition-colors duration-150 hover:border-grafito"
      >
        <Phone aria-hidden className="size-4" />
        Llamar a sucursal
      </a>

      <p className="text-xs text-tinta-suave">
        Respondemos en minutos en horario hábil · El asistente cotiza 24/7
      </p>

      <ul className="mt-2 grid gap-2 border-t border-borde pt-4 text-[13px] text-tinta-suave sm:grid-cols-2">
        {GARANTIAS.map((g) => (
          <li key={g.texto} className="flex items-center gap-2">
            <g.icono aria-hidden className="size-4 shrink-0" />
            {g.texto}
          </li>
        ))}
      </ul>
    </div>
  );
}
