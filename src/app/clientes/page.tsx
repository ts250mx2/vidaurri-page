import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormularioCredenciales } from "@/components/kiosco/FormularioCredenciales";
import { RUTA_CLIENTES_PEDIDO } from "@/lib/clientes/rutas";
import { sesionCliente } from "@/lib/clientes/sesion";

// Entrar al área de clientes: celular (usuario) y contraseña. Es la única
// pantalla del área que se ve sin sesión; con sesión se pasa directo a armar
// el pedido (el guardia de borde ya lo hace; esto es el cinturón).

export const metadata: Metadata = {
  title: "Entra con tu celular",
};

export const dynamic = "force-dynamic";

export default async function PaginaEntrarClientes() {
  if (await sesionCliente()) redirect(RUTA_CLIENTES_PEDIDO);
  return <FormularioCredenciales />;
}
