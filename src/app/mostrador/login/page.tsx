import type { Metadata } from "next";
import { destinoTrasLogin } from "@/lib/mostrador/volver";
import { FormularioLogin } from "./FormularioLogin";

// Entrada al mostrador con el mismo usuario y contraseña del POS. La página es
// de servidor: solo acota el `?volver=` que dejó el proxy y se lo pasa al
// formulario (cliente), que hace el POST a /api/mostrador/login de PAGE.

export const metadata: Metadata = {
  title: "Entrar al mostrador",
};

interface ParametrosLogin {
  volver?: string;
  /** "sesion" cuando el proxy o el logout sacaron al vendedor por sesión vencida. */
  motivo?: string;
}

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<ParametrosLogin>;
}) {
  const { volver, motivo } = await searchParams;
  const sesionVencida = motivo === "sesion";

  return (
    <div className="mx-auto max-w-md py-8 sm:py-14">
      <div className="lamina p-6 sm:p-8">
        <p className="rotulo-tecnico text-xs text-tinta-suave">Mostrador</p>
        <h1 className="titulo-lamina mt-2 text-3xl">Entra con tu usuario del POS</h1>
        <p className="mt-3 text-sm leading-relaxed text-tinta-suave">
          Usa el mismo usuario y contraseña que en el punto de venta. La sesión
          dura 12 horas.
        </p>
        {sesionVencida && (
          <p
            role="status"
            className="mt-4 rounded-md border border-linea bg-papel px-3.5 py-2.5 text-sm text-tinta"
          >
            Tu sesión venció. Entra de nuevo para seguir donde ibas.
          </p>
        )}
        <FormularioLogin volver={destinoTrasLogin(volver)} />
      </div>
    </div>
  );
}
