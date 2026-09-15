import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Acuse } from "@/app/kiosco/listo/Acuse";
import { RUTA_CLIENTES_PEDIDO } from "@/lib/clientes/rutas";
import { esSucursalEntrega } from "@/lib/kiosco/identidad";
import { folioValido } from "@/lib/kiosco/tipos";

// Paso 3 del área de clientes: el acuse. Folio, piezas, total y sucursal
// llegan por la URL porque es lo único que IA devuelve al enviar (ni id de
// pedido ni partidas) y porque el borrador ya no existe. Nada de esto es
// secreto: el folio está hecho para decirlo en voz alta en el mostrador.
//
// Sin un folio con forma de folio no hay nada que acusar y se vuelve a armar.

export const metadata: Metadata = {
  title: "Tu folio",
};

export const dynamic = "force-dynamic";

interface ParametrosAcuse {
  folio?: string;
  piezas?: string;
  total?: string;
  sucursal?: string;
}

/** Entero no negativo del querystring; 0 si viene mal. */
function entero(valor: string | undefined): number {
  const numero = Number.parseInt(valor ?? "", 10);
  return Number.isFinite(numero) && numero > 0 ? numero : 0;
}

/** Importe del querystring; 0 si viene mal (mejor un cero visible que un NaN). */
function importe(valor: string | undefined): number {
  const numero = Number.parseFloat(valor ?? "");
  return Number.isFinite(numero) && numero > 0 ? numero : 0;
}

export default async function PaginaListoClientes({
  searchParams,
}: {
  searchParams: Promise<ParametrosAcuse>;
}) {
  const { folio, piezas, total, sucursal } = await searchParams;
  const folioLimpio = folioValido(folio);
  if (!folioLimpio) redirect(RUTA_CLIENTES_PEDIDO);

  return (
    <Acuse
      folio={folioLimpio}
      piezas={entero(piezas)}
      total={importe(total)}
      sucursal={esSucursalEntrega(sucursal) ? sucursal : null}
    />
  );
}
