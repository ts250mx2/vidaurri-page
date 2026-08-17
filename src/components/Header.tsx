"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone } from "lucide-react";
import clsx from "clsx";
import { MarcaAV } from "@/components/LogoAV";
import { IconWhatsApp } from "@/components/IconWhatsApp";
import { NEGOCIO, urlWhatsApp, PRELLENADOS } from "@/config/negocio";

// Header del mostrador. Dos pisos, como el letrero de una refaccionaria:
//
// 1. La CINTA UTILITARIA (arriba, grafito hondo): lo que cualquier cliente
//    pregunta antes de comprar — facturación, envíos, años de casa, horario y
//    teléfono. Es INFORMATIVA: sin ámbar y sin botones, porque ahí no hay nada
//    que convertir. En móvil no aparece (el sticky se comería la pantalla y
//    `BarraMovil` ya deja el teléfono a un tap); su contenido se repite dentro
//    del menú desplegable.
// 2. La banda de navegación (grafito) con el filo ámbar de 4px, la única
//    licencia decorativa del ámbar junto al borde del bloque de precio. La
//    sección activa se marca con un filete blanco, nunca con ámbar: el ámbar
//    es para tocar, no para orientarse.

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
  "Facturamos CFDI 4.0",
  "Envíos a todo México",
  `${NEGOCIO.experiencia} en Monterrey`,
] as const;

/** El horario tal como está capturado no cabe en una cinta de 12px: se abrevian
 *  los días. Las horas se muestran tal cual — el dato no se toca. */
const ABREVIATURAS: ReadonlyArray<readonly [string, string]> = [
  ["Lunes a viernes", "Lun a Vie"],
  ["Sábado", "Sáb"],
];

const HORARIO = ABREVIATURAS.reduce<string>(
  (texto, [largo, corto]) => texto.replace(largo, corto),
  NEGOCIO.sucursales[0].horario
);

export function Header() {
  const [abierto, setAbierto] = useState(false);
  const ruta = usePathname();

  /** Activo también en las fichas hijas (/pieza/... cuelga de Refacciones). */
  const esActivo = (href: string) =>
    ruta === href ||
    ruta.startsWith(`${href}/`) ||
    (href === "/refacciones" && ruta.startsWith("/pieza"));

  return (
    <header className="sobre-grafito sticky top-0 z-50 border-b-4 border-ambar bg-grafito text-white">
      <div className="hidden border-b border-white/10 bg-grafito-hondo sm:block">
        <div className="mx-auto flex h-9 max-w-6xl items-center justify-between gap-4 px-4 text-[12px] text-slate-400">
          <p className="flex min-w-0 items-center gap-2">
            {SENALES_COMERCIO.map((senal, i) => (
              <span
                key={senal}
                className={clsx(
                  "flex items-center gap-2",
                  // El tercero solo cuando sobra ancho: primero manda la factura.
                  i === 2 && "hidden lg:flex"
                )}
              >
                {i > 0 && (
                  <span aria-hidden className="text-slate-600">
                    ·
                  </span>
                )}
                <span className="truncate">{senal}</span>
              </span>
            ))}
          </p>

          <p className="flex shrink-0 items-center gap-3">
            <span className="num-tab hidden md:inline">{HORARIO}</span>
            <a
              href={`tel:${NEGOCIO.telefono}`}
              className="flex h-9 items-center gap-1.5 text-slate-300 transition-colors duration-150 hover:text-white"
            >
              <Phone aria-hidden className="size-3.5" />
              <span className="num-tab font-mono">{NEGOCIO.telefonoBonito}</span>
            </a>
          </p>
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href="/" onClick={() => setAbierto(false)} className="shrink-0">
          <MarcaAV lado={34} />
        </Link>

        <nav aria-label="Principal" className="ml-8 hidden h-full md:flex">
          {ENLACES.map((e) => {
            const activo = esActivo(e.href);
            return (
              <Link
                key={e.href}
                href={e.href}
                aria-current={activo ? "page" : undefined}
                className={clsx(
                  "relative flex items-center px-3.5 font-display text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors duration-150",
                  activo ? "text-white" : "text-slate-400 hover:text-white"
                )}
              >
                {e.texto}
                {activo && (
                  <span
                    aria-hidden
                    className="absolute inset-x-3 bottom-0 h-0.5 bg-white"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <a
            href={`tel:${NEGOCIO.telefono}`}
            className="flex items-center gap-1.5 text-slate-300 transition-colors hover:text-white"
          >
            <Phone aria-hidden className="size-4" />
            <span className="num-tab font-mono text-[13px]">
              {NEGOCIO.telefonoBonito}
            </span>
          </a>
          <a
            href={urlWhatsApp(PRELLENADOS.generico)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-whatsapp px-3.5 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
          >
            <IconWhatsApp lado={16} />
            WhatsApp
          </a>
        </div>

        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-expanded={abierto}
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          className="ml-auto rounded-lg p-2 text-slate-200 transition-colors hover:bg-grafito-claro md:hidden"
        >
          {abierto ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {abierto && (
        <nav
          aria-label="Principal móvil"
          className="border-t border-grafito-claro bg-grafito px-4 pb-4 md:hidden"
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
                  "flex items-center justify-between border-b border-grafito-claro py-3.5 font-display text-[15px] font-semibold uppercase tracking-[0.06em]",
                  activo ? "text-white" : "text-slate-400"
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
          <p className="mt-4 text-[13px] leading-relaxed text-slate-400">
            {SENALES_COMERCIO.join(" · ")}
            <br />
            <span className="num-tab">{HORARIO}</span>
          </p>

          <a
            href={`tel:${NEGOCIO.telefono}`}
            className="mt-3 flex min-h-11 items-center gap-2 text-[15px] text-slate-200"
          >
            <Phone aria-hidden className="size-4" />
            <span className="num-tab font-mono">{NEGOCIO.telefonoBonito}</span>
          </a>
        </nav>
      )}
    </header>
  );
}
