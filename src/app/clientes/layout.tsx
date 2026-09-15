import type { Metadata } from "next";
import { MarcaAV } from "@/components/LogoAV";
import { AvisoPassword } from "@/components/clientes/AvisoPassword";
import { BarraClientes } from "@/components/clientes/BarraClientes";
import { ProveedorArea } from "@/components/kiosco/AreaContext";
import { PasosKiosco } from "@/components/kiosco/PasosKiosco";
import { sesionCliente } from "@/lib/clientes/sesion";

// El cromo del área de clientes: ligero a propósito. Una barra con la marca,
// "Hola, NOMBRE", Armar pedido / Mis pedidos / Contraseña y Salir; ni el menú
// del sitio público ni nada del mostrador. Es el cliente en SU dispositivo
// (casi siempre el celular): móvil primero, una sola columna, y en pantalla
// grande la misma barra en un renglón.
//
// La cáscara mide exactamente la pantalla (`h-dvh`) y es `main` el que hace
// scroll: así la pantalla de armar el pedido reparte el alto entre el chat y
// la barra del pedido sin cálculos de píxeles. Sin reinicio por inactividad:
// no es una PC compartida.
//
// Vive fuera del grupo `(sitio)` por lo mismo que /mostrador y /kiosco:
// comparte el documento (fuentes, hoja global) pero no el header público, ni
// la barra móvil, ni el chat flotante.

export const metadata: Metadata = {
  title: {
    default: "Área de clientes",
    template: "%s · Clientes · Autopartes Vidaurri",
  },
  robots: { index: false, follow: false },
};

export default async function LayoutClientes({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Solo el nombre y las dos banderas bajan a la barra: el id del padrón y
  // el celular se quedan en la cookie, que el navegador no lee.
  const sesion = await sesionCliente();

  return (
    <ProveedorArea area="cliente">
      <div className="piso-kiosco flex h-dvh flex-col bg-papel text-tinta">
        <header className="sobre-plano shrink-0 bg-plano-hondo text-white">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2.5 sm:px-6 sm:py-3">
            <MarcaAV lado={30} />
            <span className="rotulo-tecnico hidden whitespace-nowrap border-l border-white/25 pl-4 text-xs text-white/70 md:block">
              Área de clientes
            </span>
            <PasosKiosco className="hidden xl:flex xl:ml-6" />
            <BarraClientes nombre={sesion?.nombre ?? null} />
          </div>
          <div aria-hidden className="h-1 bg-ambar" />
        </header>

        {sesion?.passwordPorDefecto && <AvisoPassword />}

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6">{children}</div>
        </main>
      </div>
    </ProveedorArea>
  );
}
