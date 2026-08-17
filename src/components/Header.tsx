"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, FileText, Truck, MapPin, Clock } from "lucide-react";
import clsx from "clsx";
import { MarcaAV } from "@/components/LogoAV";
import { IconWhatsApp } from "@/components/IconWhatsApp";
import { NEGOCIO, urlWhatsApp, PRELLENADOS } from "@/config/negocio";

// Header del despiece: el rótulo superior de la lámina. Dos pisos, como el
// encabezado de un plano de taller.
//
// 1. La CINTA UTILITARIA (tinta de plano honda): las notas al margen — lo que
//    cualquier cliente pregunta antes de comprar: facturación, envíos, años de
//    casa, horario y teléfono. Es INFORMATIVA: sin ámbar y sin botones, porque
//    ahí no hay nada que convertir. En móvil no aparece (el sticky se comería
//    la pantalla y `BarraMovil` ya deja el teléfono a un tap); su contenido se
//    repite dentro del menú desplegable.
// 2. La banda de navegación (campo azul) con el filo ámbar de 4px: el ámbar
//    marca dónde se toca, nunca dónde se está. La sección activa lleva un
//    filete blanco.
//
// Todo el header va envuelto en `.sobre-plano`: sobre campo azul el foco se
// dibuja en ámbar, no en tinta roja.

const ENLACES = [
  { href: "/refacciones", texto: "Refacciones" },
  { href: "/usadas", texto: "Usadas" },
  { href: "/mayoreo", texto: "Mayoreo" },
  { href: "/nosotros", texto: "Nosotros" },
  { href: "/sucursales", texto: "Sucursales" },
];

/** Señales de comercio de la cinta. Son afirmaciones del negocio (facturación
 *  y envíos no viven en la base): si cambian, se editan aquí y en ningún otro
 *  lado. Los años sí salen de `negocio.ts` para no duplicar el dato. */
const SENALES_COMERCIO = [
  { Icono: FileText, rotulo: "Facturación", valor: "Facturamos CFDI 4.0" },
  { Icono: Truck, rotulo: "Envíos", valor: "Envíos a todo México" },
  {
    Icono: MapPin,
    rotulo: "Ubicación",
    valor: `${NEGOCIO.experiencia} en Monterrey`,
  },
] as const;

/** El horario tal como está capturado no cabe en una cinta de 12px: se abrevian
 *  los días. Las horas se muestran tal cual — el dato no se toca. */
const ABREVIATURAS: ReadonlyArray<readonly [string, string]> = [
  ["Lunes a viernes", "Lun a Vie"],
  ["Sábado", "Sáb"],
];

/** null mientras el horario no esté confirmado: la cinta se arma sin él antes
 *  que publicar un dato que puede dejar a alguien frente a una cortina cerrada. */
const HORARIO: string | null = NEGOCIO.sucursales[0].horario
  ? ABREVIATURAS.reduce<string>(
      (texto, [largo, corto]) => texto.replace(largo, corto),
      NEGOCIO.sucursales[0].horario
    )
  : null;

export function Header() {
  const [abierto, setAbierto] = useState(false);
  const ruta = usePathname();

  const esActivo = (href: string) =>
    ruta === href ||
    ruta.startsWith(`${href}/`) ||
    (href === "/refacciones" && ruta.startsWith("/pieza"));

  return (
    <header className="sobre-plano absolute top-0 inset-x-0 z-50 bg-[#111116]/30 backdrop-blur-md text-white transition-colors duration-200 hover:bg-[#111116]/50 after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:content-[''] after:[background:linear-gradient(90deg,var(--color-oro-hondo),var(--color-oro-claro)_22%,var(--color-ambar)_50%,var(--color-oro-claro)_78%,var(--color-oro-hondo))]">
      {/* Cinta utilitaria superior */}
      <div className="hidden border-b border-white/10 bg-black/20 backdrop-blur-xs sm:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-4 px-4 text-[11.5px] text-white/80">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <Clock aria-hidden className="size-3.5 shrink-0 text-ambar" />
              <span>
                <strong className="font-semibold text-white">Horario:</strong> Lun-Vie 8:30–18:00, Sáb 8:30–14:00
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin aria-hidden className="size-3.5 shrink-0 text-ambar" />
              <span>
                <strong className="font-semibold text-white">Ubicación:</strong> Más de 40 años en Monterrey
              </span>
            </span>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <Truck aria-hidden className="size-3.5 shrink-0 text-ambar" />
              <span>
                <strong className="font-semibold text-white">Envíos:</strong> Envíos a todo México
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <FileText aria-hidden className="size-3.5 shrink-0 text-ambar" />
              <span>
                <strong className="font-semibold text-white">Facturación:</strong> Facturamos CFDI 4.0
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Barra de navegación principal */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          onClick={() => setAbierto(false)}
          aria-label={`${NEGOCIO.nombre}, ir al inicio`}
          className="flex items-center gap-3"
        >
          <MarcaAV lado={36} />
        </Link>

        <nav aria-label="Principal" className="hidden h-full items-center gap-1 md:flex">
          {ENLACES.map((e) => {
            const activo = esActivo(e.href);
            return (
              <Link
                key={e.href}
                href={e.href}
                aria-current={activo ? "page" : undefined}
                className={clsx(
                  "rotulo-tecnico relative flex h-full items-center px-4 text-[13px] tracking-wider transition-colors duration-150",
                  activo ? "font-bold text-white" : "text-white/75 hover:text-white"
                )}
              >
                {e.texto}
                {activo && (
                  <span
                    aria-hidden
                    className="absolute inset-x-3 bottom-0 h-0.5 bg-ambar shadow-[0_0_8px_var(--color-ambar)]"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <div className="flex items-center gap-2 text-white/90">
            <Phone aria-hidden className="size-4 text-ambar" />
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[10px] text-white/60">Teléfono:</span>
              <a
                href={`tel:${NEGOCIO.telefono}`}
                className="num-tab font-mono text-[13px] font-semibold hover:text-white"
              >
                {NEGOCIO.telefonoBonito}
              </a>
            </div>
          </div>

          <a
            href={urlWhatsApp(PRELLENADOS.generico)}
            target="_blank"
            rel="noopener noreferrer"
            className="rotulo-tecnico flex h-9 items-center gap-2 rounded-full border border-white/30 bg-black/40 px-4 text-[11.5px] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-150 hover:border-ambar hover:bg-black/60"
          >
            <IconWhatsApp lado={15} />
            WHATSAPP
          </a>
        </div>

        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-controls="menu-movil"
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          className="-mr-2 ml-auto inline-flex size-11 items-center justify-center rounded-md text-white transition-colors duration-150 hover:bg-plano-claro md:hidden"
        >
          {abierto ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {abierto && (
        <nav
          id="menu-movil"
          aria-label="Principal móvil"
          className="border-t border-white/15 bg-plano px-4 pb-5 md:hidden"
        >
          {ENLACES.map((e) => {
            const activo = esActivo(e.href);
            return (
              <Link
                key={e.href}
                href={e.href}
                onClick={() => setAbierto(false)}
                aria-current={activo ? "page" : undefined}
                className={clsx(
                  "rotulo-tecnico flex min-h-11 items-center justify-between border-b border-white/10 py-3.5 text-[15px]",
                  activo ? "text-white" : "text-white/70"
                )}
              >
                {e.texto}
                {activo && (
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </Link>
            );
          })}

          {/* En móvil la cinta no cabe arriba: sus datos bajan aquí. */}
          <ul className="mt-4 space-y-2 text-[13px] leading-snug text-white/70">
            {SENALES_COMERCIO.map(({ Icono, valor }) => (
              <li key={valor} className="flex items-center gap-2">
                <Icono aria-hidden className="size-3.5 shrink-0 text-ambar" />
                {valor}
              </li>
            ))}
            {HORARIO && (
              <li className="flex items-center gap-2">
                <Clock aria-hidden className="size-3.5 shrink-0 text-ambar" />
                <span className="num-tab">{HORARIO}</span>
              </li>
            )}
          </ul>

          <a
            href={`tel:${NEGOCIO.telefono}`}
            className="mt-2 flex min-h-11 items-center gap-2 text-[15px] text-white"
          >
            <Phone aria-hidden className="size-4" />
            <span className="num-tab font-mono">{NEGOCIO.telefonoBonito}</span>
          </a>
        </nav>
      )}
    </header>
  );
}
