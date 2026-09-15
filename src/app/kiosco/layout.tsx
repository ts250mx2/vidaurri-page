import type { Metadata } from "next";
import clsx from "clsx";
import { MarcaAV } from "@/components/LogoAV";
import { ProveedorArea } from "@/components/kiosco/AreaContext";
import { BarraCliente } from "@/components/kiosco/BarraCliente";
import { Inactividad } from "@/components/kiosco/Inactividad";
import { PasosKiosco } from "@/components/kiosco/PasosKiosco";
import { nombreSucursal } from "@/lib/kiosco/identidad";
import { sesionClienteKiosco, sesionKiosco } from "@/lib/kiosco/sesion";

// El cromo del kiosco: una barra con la marca, los tres pasos y la esquina
// del cliente (entrar con su celular / "Hola, NOMBRE", sus pedidos, salir).
// Sin menú, sin enlaces al sitio público, sin "Salir del kiosco" a la vista y
// sin rastro de /mostrador. Quien se quede jugando con la pantalla no tiene a
// dónde ir: para sacar la PC del modo kiosco hay que teclear /kiosco/salir y
// poner usuario y clave del POS. El "Salir" del cliente es otra cosa: cierra
// SU sesión y deja la PC como público general.
//
// La cáscara mide exactamente la pantalla (`h-dvh`) y es `main` el que hace
// scroll: así la pantalla de armar el pedido reparte el alto entre el chat y
// el pedido sin cálculos de píxeles, igual que en el área de clientes.
//
// Vive fuera del grupo `(sitio)` por lo mismo que /mostrador: comparte el
// documento (fuentes, hoja global) pero no el header público, ni la barra
// móvil, ni el chat flotante de clientes.

export const metadata: Metadata = {
  title: "Arma tu pedido",
  robots: { index: false, follow: false },
};

export default async function LayoutKiosco({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Sin sesión estamos en activar o salir: la barra se pinta sin el rótulo
  // del aparato, sin necesidad de leer la ruta desde un layout de servidor.
  const sesion = await sesionKiosco();
  // Solo el nombre baja a la barra: el id del padrón y el celular se quedan
  // en la cookie, que el navegador no lee.
  const cliente = sesion ? await sesionClienteKiosco() : null;

  return (
    <ProveedorArea area="kiosco">
      <div className="piso-kiosco flex h-dvh flex-col bg-papel text-tinta">
        <header className="sobre-plano shrink-0 bg-plano-hondo text-white">
          <div className="mx-auto flex w-full max-w-[1400px] items-center gap-6 px-6 py-3">
            <MarcaAV lado={34} />
            {/* Con cliente la barra ya dice su nombre y sus enlaces; a 1366 px el
                rótulo no cabe sin partir los pasos, así que cede el sitio. */}
            <span
              className={clsx(
                "rotulo-tecnico whitespace-nowrap border-l border-white/25 pl-4 text-xs text-white/70",
                cliente && "hidden 2xl:block"
              )}
            >
              Arma tu pedido
            </span>
            <div className="ml-auto flex items-center gap-6">
              <PasosKiosco />
              {sesion && <BarraCliente nombre={cliente?.nombre ?? null} />}
              {sesion && (
                <p className="hidden border-l border-white/15 pl-4 text-right text-[11px] leading-tight text-white/45 lg:block">
                  {sesion.nombre}
                  <span className="block">{nombreSucursal(sesion.sucursal)}</span>
                </p>
              )}
            </div>
          </div>
          <div aria-hidden className="h-1 bg-ambar" />
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-6 py-6">{children}</div>
        </main>
        <Inactividad />
      </div>
    </ProveedorArea>
  );
}
