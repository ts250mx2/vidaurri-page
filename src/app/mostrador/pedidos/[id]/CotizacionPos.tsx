"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import clsx from "clsx";
import { CLASE_BOTON_SECUNDARIO, CLASE_ERROR } from "@/components/mostrador/estilos";
import { etiquetaCotizaPos } from "@/lib/mostrador/etiquetas";
import { esOk, llamarProxy, mensajeFallo, sesionVencida } from "@/lib/mostrador/navegador";
import type { EstatusPedido } from "@/lib/mostrador/tipos";

// Cotización espejo del pedido en el POS (contrato B4): el número cuando ya
// se levantó, el estado cuando no, y el botón para volver a intentarlo
// cuando falló o quedó pendiente. IA solo acepta el reintento con el pedido
// listo o entregado; en cualquier otro estatus el botón ni se pinta.

const ERROR_GENERICO = "No fue posible cotizar en el POS; intenta de nuevo";

interface Props {
  idPedido: number;
  estatus: EstatusPedido;
  numCotizaPos: number | null;
  estado: string;
  errorPos: string | null;
}

function admiteReintento(estatus: EstatusPedido): boolean {
  return estatus === "listo" || estatus === "entregado";
}

export function CotizacionPos({ idPedido, estatus, numCotizaPos, estado, errorPos }: Props) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conNumero = numCotizaPos !== null && (estado === "insertada" || estado === "cancelada");
  const conBoton = admiteReintento(estatus) && (estado === "error" || estado === "pendiente");

  async function reintentar() {
    if (enviando) return;
    setEnviando(true);
    setError(null);
    const respuesta = await llamarProxy(`/pedidos/${idPedido}/cotizacion`, { metodo: "POST", cuerpo: {} });
    setEnviando(false);
    if (sesionVencida(respuesta.status)) return;
    if (!esOk(respuesta.datos)) {
      setError(mensajeFallo(respuesta, ERROR_GENERICO));
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {conNumero ? (
        <span className="num-tab font-mono font-semibold">
          {numCotizaPos}
          {estado === "cancelada" && (
            <span className="ml-2 font-sans text-xs font-normal text-anotacion">{etiquetaCotizaPos(estado)}</span>
          )}
        </span>
      ) : (
        <span className={estado === "error" ? "text-anotacion" : "text-tinta-suave"}>
          {estado === "error" && errorPos ? `Error: ${errorPos}` : etiquetaCotizaPos(estado)}
        </span>
      )}
      {conBoton && (
        <button
          type="button"
          onClick={() => void reintentar()}
          disabled={enviando}
          className={clsx(CLASE_BOTON_SECUNDARIO, "gap-1.5")}
        >
          <RefreshCw aria-hidden className={clsx("size-3.5", enviando && "animate-spin")} />
          {enviando ? "Cotizando…" : estado === "error" ? "Reintentar" : "Cotizar en el POS"}
        </button>
      )}
      {error && (
        <p role="alert" className={clsx(CLASE_ERROR, "w-full text-xs")}>
          {error}
        </p>
      )}
    </div>
  );
}
