import type { Metadata } from "next";
import { redirect, unstable_rethrow } from "next/navigation";
import { FormularioCredenciales } from "@/components/kiosco/FormularioCredenciales";
import { obtenerBorradorKiosco } from "@/lib/kiosco/datos";
import { RUTA_KIOSCO, RUTA_KIOSCO_ACTIVAR } from "@/lib/kiosco/rutas";
import { sesionClienteKiosco, sesionKiosco } from "@/lib/kiosco/sesion";

// El cliente registrado entra con su celular y su contraseña (la primera vez,
// el mismo celular). Es el mismo formulario del área de clientes, en su
// variante de kiosco: con teclado y con "Seguir sin cuenta". Si ya entró, no
// hay nada que hacer aquí y se vuelve al armado.
//
// Se lee el borrador solo para avisar con honestidad: al entrar, IA vacía lo
// que el anónimo llevaba (el pedido se vuelve a cotizar con su precio de
// cliente), y eso el cliente tiene que saberlo ANTES de teclear su número.

export const metadata: Metadata = {
  title: "Entra con tu celular",
};

export const dynamic = "force-dynamic";

export default async function PaginaEntrarKiosco() {
  const sesion = await sesionKiosco();
  if (!sesion) redirect(RUTA_KIOSCO_ACTIVAR);
  if (await sesionClienteKiosco()) redirect(RUTA_KIOSCO);

  let hayPiezas = false;
  try {
    const borrador = await obtenerBorradorKiosco();
    hayPiezas = (borrador?.partidas.length ?? 0) > 0;
  } catch (error) {
    unstable_rethrow(error);
    // Sin borrador legible no se avisa nada: entrar sigue siendo posible.
    console.error("[kiosco] no se pudo leer el borrador antes de entrar", error);
  }

  return <FormularioCredenciales hayPiezas={hayPiezas} />;
}
