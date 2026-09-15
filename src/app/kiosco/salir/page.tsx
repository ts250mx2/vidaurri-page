import type { Metadata } from "next";
import { nombreSucursal } from "@/lib/kiosco/identidad";
import { sesionKiosco } from "@/lib/kiosco/sesion";
import { FormularioSalir } from "./FormularioSalir";

// Pantalla del PERSONAL: saca la PC del modo kiosco. No se llega por ningún
// enlace —el kiosco no tiene menú a propósito— sino escribiendo la ruta, y aun
// así hay que poner usuario y clave del POS.

export const metadata: Metadata = {
  title: "Salir del modo kiosco",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PaginaSalirKiosco() {
  const sesion = await sesionKiosco();

  return (
    <div className="mx-auto max-w-md py-6">
      <div className="lamina p-6 sm:p-8">
        <p className="rotulo-tecnico text-xs text-tinta-suave">Kiosco de autoservicio</p>
        <h1 className="titulo-lamina mt-2 text-3xl">Salir del modo kiosco</h1>
        {sesion ? (
          <p className="mt-3 text-sm leading-relaxed text-tinta-suave">
            Esta computadora es <strong className="text-tinta">{sesion.nombre}</strong> (
            {nombreSucursal(sesion.sucursal)}). Al salir se borra su credencial y la pantalla vuelve
            a pedir activación.
          </p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-tinta-suave">
            Esta computadora ya no está en modo kiosco. Si quieres volver a ponerla, actívala con un
            usuario de Administración u Operaciones.
          </p>
        )}
        <FormularioSalir />
      </div>
    </div>
  );
}
