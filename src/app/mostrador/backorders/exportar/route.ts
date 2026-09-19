import { unstable_rethrow } from "next/navigation";
import { hojaBackorder, listarPedidos } from "@/lib/mostrador/datos";
import { rangoFechasLegible } from "@/lib/mostrador/etiquetas";
import { libroBackorders, TIPO_XLSX, type BackorderParaExcel } from "@/lib/mostrador/excel-backorders";
import { conFechasPorDefecto, filtrosDeQuery, rangoMesEnCurso } from "@/lib/mostrador/filtros";
import { tieneBackorder } from "@/lib/mostrador/reglas";
import type { PedidoResumen } from "@/lib/mostrador/tipos";

// Las back orders del rango en un .xlsx. Vive bajo /mostrador (no bajo /api)
// a propósito: así la cubre el guardia de borde y, si la sesión venció, el
// clic en "Exportar" acaba en login igual que cualquier otra pantalla. Lee lo
// mismo que la página —la cola con `backorder=si`, mismo rango por defecto— y
// además la hoja de cada pedido, que es donde están las piezas. Una hoja que
// no llega no tumba el archivo: ese renglón sale sin piezas y lo dice.

export const dynamic = "force-dynamic";

/** Hojas que se piden a IA a la vez: las back orders de un mes son decenas, no hace falta más. */
const HOJAS_EN_PARALELO = 6;

async function conHoja(pedido: PedidoResumen): Promise<BackorderParaExcel> {
  try {
    return { pedido, hoja: await hojaBackorder(pedido.id) };
  } catch (error) {
    // El redirect a login por sesión vencida viaja como excepción: se deja pasar.
    unstable_rethrow(error);
    console.error("[mostrador] fallo leyendo la hoja de back order para el Excel", pedido.id, error);
    return { pedido, hoja: null };
  }
}

async function conHojas(pedidos: ReadonlyArray<PedidoResumen>): Promise<BackorderParaExcel[]> {
  const resultado: BackorderParaExcel[] = [];
  for (let inicio = 0; inicio < pedidos.length; inicio += HOJAS_EN_PARALELO) {
    const tanda = pedidos.slice(inicio, inicio + HOJAS_EN_PARALELO);
    resultado.push(...(await Promise.all(tanda.map(conHoja))));
  }
  return resultado;
}

function nombreArchivo(desde?: string, hasta?: string): string {
  const rango = [desde, hasta].filter(Boolean).join("_a_");
  return `back-orders-aldo${rango ? `_${rango}` : ""}.xlsx`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const urlFiltros = filtrosDeQuery(Object.fromEntries(searchParams));
  const { desde, hasta } = conFechasPorDefecto(
    { desde: urlFiltros.desde, hasta: urlFiltros.hasta, pagina: 1, porPagina: "todos" },
    rangoMesEnCurso(new Date())
  );

  let pedidos: PedidoResumen[];
  try {
    const pagina = await listarPedidos({ desde, hasta, backorder: "si", porPagina: "todos" });
    // Mismo cinturón que la página, por si el motor ignora `backorder=si`.
    pedidos = pagina.pedidos.filter(tieneBackorder);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[mostrador] fallo listando las back orders para el Excel", error);
    return new Response("No fue posible leer las back orders. Vuelve a intentar.", {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const libro = await libroBackorders(await conHojas(pedidos), rangoFechasLegible(desde, hasta));
  return new Response(libro.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": TIPO_XLSX,
      "Content-Disposition": `attachment; filename="${nombreArchivo(desde, hasta)}"`,
      "Cache-Control": "no-store",
    },
  });
}
