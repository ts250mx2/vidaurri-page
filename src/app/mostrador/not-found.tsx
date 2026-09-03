import Link from "next/link";
import { RUTA_MOSTRADOR } from "@/lib/mostrador/volver";

// 404 del área del vendedor. El not-found de la raíz pinta el cromo público
// (header, chat de clientes, barra móvil) que aquí no tiene sentido; este
// solo devuelve a la cola.

export default function NoEncontradoMostrador() {
  return (
    <div className="mx-auto max-w-md py-12">
      <div className="lamina p-6 text-center sm:p-8">
        <p className="rotulo-tecnico text-xs text-tinta-suave">Mostrador</p>
        <h1 className="titulo-lamina mt-2 text-3xl">Ese pedido no existe</h1>
        <p className="mt-3 text-sm leading-relaxed text-tinta-suave">
          Revisa el folio o búscalo en la cola.
        </p>
        <Link
          href={RUTA_MOSTRADOR}
          className="rotulo-tecnico mt-6 inline-flex h-12 items-center rounded-md border border-tinta bg-plano px-5 text-sm text-white transition-colors duration-150 hover:bg-plano-hondo"
        >
          Ir a la cola de pedidos
        </Link>
      </div>
    </div>
  );
}
