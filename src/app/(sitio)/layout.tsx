import { CromoPublico } from "@/components/CromoPublico";

// Grupo de rutas del sitio público: todo lo que ve el cliente (home, catálogo,
// fichas, usadas, mayoreo, nosotros, sucursales, aviso) comparte este cromo.
// `/mostrador` queda fuera del grupo a propósito: es la pantalla del vendedor
// y no lleva header público, barra móvil ni chat de Vico.
export default function LayoutSitio({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <CromoPublico>{children}</CromoPublico>;
}
