import type { Metadata } from "next";
import { nombreSucursal } from "@/lib/kiosco/identidad";
import { RUTA_KIOSCO_SALIR } from "@/lib/kiosco/rutas";
import { sesionKiosco } from "@/lib/kiosco/sesion";

import { FormularioActivar } from "./FormularioActivar";

// Pantalla del PERSONAL: convierte esta computadora en un kiosco de
// autoservicio. Queda fuera del candado del proxy (es la puerta de entrada) y
// explica qué es lo que se está activando, porque quien la ve una vez cada
// seis meses no tiene por qué acordarse.

export const metadata: Metadata = {
  title: "Activar el kiosco",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const SUCURSAL_POR_DEFECTO = "matriz" as const;

export default async function PaginaActivarKiosco() {
  const sesion = await sesionKiosco();

  return (
    <div className="mx-auto max-w-xl py-6">
      <div className="lamina p-6 sm:p-8">
        <p className="rotulo-tecnico text-xs text-tinta-suave">Kiosco de autoservicio</p>
        <h1 className="titulo-lamina mt-2 text-3xl">Activa esta computadora</h1>
        <p className="mt-3 text-sm leading-relaxed text-tinta-suave">
          El kiosco es la pantalla que el cliente usa solo, en el piso de la tienda: busca su pieza,
          la agrega y manda su pedido a la cola del mostrador. No ve la cola, ni pedidos de nadie, ni
          existencias exactas, ni precios de padrón: solo el catálogo a precio de mostrador con IVA
          incluido.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-tinta-suave">
          La credencial es de la <strong className="text-tinta">máquina</strong>, no tuya: se guarda
          180 días y aquí no queda ninguna sesión de vendedor. Solo Administración u Operaciones
          pueden activarla.
        </p>

        {sesion && (
          <p
            role="status"
            className="mt-4 rounded-md border border-linea bg-papel px-3.5 py-2.5 text-sm text-tinta"
          >
            Esta computadora ya es <strong>{sesion.nombre}</strong> (
            {nombreSucursal(sesion.sucursal)}). Vuelve a activarla solo si quieres cambiarle el
            nombre o la sucursal.
          </p>
        )}

        <FormularioActivar
          nombreActual={sesion?.nombre ?? ""}
          sucursalActual={sesion?.sucursal ?? SUCURSAL_POR_DEFECTO}
        />

        <p className="mt-6 border-t border-linea pt-4 text-xs leading-relaxed text-tinta-suave">
          Para sacar la PC del modo kiosco, escribe{" "}
          <span className="num-tab font-mono text-tinta">{RUTA_KIOSCO_SALIR}</span> en la barra de
          direcciones y vuelve a poner tu usuario y contraseña del POS.
        </p>
      </div>
    </div>
  );
}
