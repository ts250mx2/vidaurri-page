import type { Metadata } from "next";
import { exigirSesionCliente } from "@/lib/clientes/datos";
import { FormularioPassword } from "./FormularioPassword";

// Cambiar la contraseña: la actual, la nueva y su confirmación, con las
// reglas a la vista. Si todavía es el celular (la primera vez), la pantalla
// lo dice para que el cliente sepa qué poner en "actual".

export const metadata: Metadata = {
  title: "Contraseña",
};

export const dynamic = "force-dynamic";

export default async function PaginaPasswordClientes() {
  const sesion = await exigirSesionCliente();
  return <FormularioPassword porDefecto={sesion.passwordPorDefecto} />;
}
