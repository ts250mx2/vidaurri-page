import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RUTA_KIOSCO } from "@/lib/kiosco/rutas";
import { folioValido } from "@/lib/kiosco/tipos";
import { Acuse } from "./Acuse";

// Paso 3: el acuse. Folio, piezas y total llegan por la URL porque es lo único
// que IA devuelve al enviar (ni id de pedido ni partidas) y porque el borrador
// ya no existe: volver a preguntarle a IA aquí no daría nada. Nada de esto es
// secreto — el folio está hecho para decirlo en voz alta en el mostrador.
//
// Sin un folio con forma de folio no hay nada que acusar y se vuelve al inicio.

export const metadata: Metadata = {
  title: "Tu folio",
};

export const dynamic = "force-dynamic";

interface ParametrosAcuse {
  folio?: string;
  piezas?: string;
  total?: string;
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

export default async function PaginaListoKiosco({
  searchParams,
}: {
  searchParams: Promise<ParametrosAcuse>;
}) {
  const { folio, piezas, total } = await searchParams;
  const folioLimpio = folioValido(folio);
  if (!folioLimpio) redirect(RUTA_KIOSCO);

  return <Acuse folio={folioLimpio} piezas={entero(piezas)} total={importe(total)} />;
}
