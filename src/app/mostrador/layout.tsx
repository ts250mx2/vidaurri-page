import type { Metadata } from "next";
import Link from "next/link";
import { MarcaAV } from "@/components/LogoAV";
import { sesionMostrador } from "@/lib/mostrador/sesion";
import { RUTA_LOGIN_MOSTRADOR, RUTA_MOSTRADOR } from "@/lib/mostrador/volver";

// Área interna del vendedor. Vive fuera del grupo `(sitio)`: no lleva el
// header público ni la barra móvil ni el chat de clientes; solo esta barra
// grafito con la marca, el rótulo "Mostrador", quién está atendiendo y la
// salida. Los robots no entran (metadata + robots.txt) y el proxy de borde
// ya garantizó que aquí solo llega quien tiene sesión, salvo en /login.

export const metadata: Metadata = {
  title: "Mostrador",
  robots: { index: false, follow: false },
};

const NAVEGACION = [
  { href: RUTA_MOSTRADOR, etiqueta: "Pedidos" },
  { href: `${RUTA_MOSTRADOR}/nuevo`, etiqueta: "Nuevo pedido" },
] as const;

export default async function LayoutMostrador({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // El proxy solo deja pasar sin sesión a /mostrador/login, así que "sin
  // sesión" equivale a "estamos en login": la barra se pinta sin usuario ni
  // enlaces, sin necesidad de leer la ruta desde un layout de servidor.
  const sesion = await sesionMostrador();

  return (
    <div className="flex min-h-screen flex-col bg-papel text-tinta">
      <header className="sobre-plano solo-pantalla bg-plano-hondo text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link
            href={sesion ? RUTA_MOSTRADOR : RUTA_LOGIN_MOSTRADOR}
            className="flex items-center gap-3 rounded-md"
          >
            <MarcaAV lado={30} />
            <span className="rotulo-tecnico border-l border-white/25 pl-3 text-xs text-white/75">
              Mostrador
            </span>
          </Link>

          {sesion && (
            <nav aria-label="Mostrador" className="ml-auto flex items-center gap-1">
              {NAVEGACION.map((enlace) => (
                <Link
                  key={enlace.href}
                  href={enlace.href}
                  className="rotulo-tecnico rounded-md px-3 py-2 text-xs text-white/80 transition-colors duration-150 hover:bg-white/10 hover:text-white"
                >
                  {enlace.etiqueta}
                </Link>
              ))}
            </nav>
          )}

          {sesion && (
            <div className="flex items-center gap-3 border-l border-white/15 pl-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold leading-tight">{sesion.nombre}</p>
                <p className="text-[11px] uppercase tracking-[0.08em] text-white/60">
                  {sesion.perfil}
                </p>
              </div>
              <form action="/api/mostrador/logout" method="post">
                <button
                  type="submit"
                  className="rotulo-tecnico inline-flex h-10 items-center rounded-md border border-white/30 px-3 text-xs text-white transition-colors duration-150 hover:border-white hover:bg-white/10"
                >
                  Salir
                </button>
              </form>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
