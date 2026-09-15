import type { Metadata } from "next";
import { MarcaAV } from "@/components/LogoAV";
import { Inactividad } from "@/components/kiosco/Inactividad";
import { PasosKiosco } from "@/components/kiosco/PasosKiosco";
import { nombreSucursal } from "@/lib/kiosco/identidad";
import { sesionKiosco } from "@/lib/kiosco/sesion";

// El cromo del kiosco: una barra con la marca, los tres pasos y nada más.
// Sin menú, sin enlaces al sitio público, sin "Salir" a la vista y sin rastro
// de /mostrador. Quien se quede jugando con la pantalla no tiene a dónde ir:
// para sacar la PC del modo kiosco hay que teclear /kiosco/salir y poner
// usuario y clave del POS.
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

  return (
    <div className="piso-kiosco flex min-h-screen flex-col bg-papel text-tinta">
      <header className="sobre-plano bg-plano-hondo text-white">
        <div className="mx-auto flex w-full max-w-[1400px] items-center gap-6 px-6 py-3">
          <MarcaAV lado={34} />
          <span className="rotulo-tecnico border-l border-white/25 pl-4 text-xs text-white/70">
            Arma tu pedido
          </span>
          <div className="ml-auto flex items-center gap-6">
            <PasosKiosco />
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

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-6">{children}</main>
      <Inactividad />
    </div>
  );
}
