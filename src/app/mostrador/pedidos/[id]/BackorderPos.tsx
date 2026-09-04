"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Printer, RefreshCw } from "lucide-react";
import clsx from "clsx";
import { CLASE_BOTON_SECUNDARIO, CLASE_ERROR } from "@/components/mostrador/estilos";
import { claseSelloBkoPos, etiquetaBkoPos } from "@/lib/mostrador/etiquetas";
import { esOk, llamarProxy, mensajeFallo, sesionVencida } from "@/lib/mostrador/navegador";
import { puedeTenerBackorder } from "@/lib/mostrador/reglas";
import type { EstatusPedido } from "@/lib/mostrador/tipos";
import { RUTA_MOSTRADOR } from "@/lib/mostrador/volver";

// Back order a Aldo Autopartes en el POS (contrato backorder): IA la levanta
// sola al confirmar el pedido con partidas sobre pedido. Aquí va el estado
// como píldora, el número y el día de entrega cuando ya existe, el fallo (o el
// resumen de la simulación) como anotación, el botón que abre la hoja para
// imprimir —siempre que haya renglones que pedir, tenga número o no— y el
// reintento cuando quedó en error o pendiente. IA solo acepta el reintento
// con el pedido confirmado, listo o entregado; en otro estatus no se pinta.
// Sin ámbar: la única acción ámbar del detalle es "Confirmar pedido".

const ERROR_GENERICO = "No fue posible crear la back order en el POS; intenta de nuevo";

interface Props {
  idPedido: number;
  estatus: EstatusPedido;
  numBkoPos: number | null;
  /** null mientras IA no mande el campo: se pinta solo la hoja. */
  estado: string | null;
  /** En "error", el fallo; en "simulada", el resumen de lo que se habría escrito. */
  errorPos: string | null;
  /** 'MARTES' | 'VIERNES'. */
  compromiso: string | null;
  /** Hay renglones que se piden a Aldo: la hoja tiene qué imprimir. */
  conPartidasSobrePedido: boolean;
}

export function BackorderPos({
  idPedido,
  estatus,
  numBkoPos,
  estado,
  errorPos,
  compromiso,
  conPartidasSobrePedido,
}: Props) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conReintento = puedeTenerBackorder(estatus) && (estado === "error" || estado === "pendiente");
  // La simulación no es un fallo: IA manda en el mismo campo lo que habría
  // escrito en el POS, y eso se lee en gris, no en rojo.
  const anotacion = estado === "error" || estado === "simulada" ? errorPos : null;

  async function reintentar() {
    if (enviando) return;
    setEnviando(true);
    setError(null);
    const respuesta = await llamarProxy(`/pedidos/${idPedido}/backorder`, { metodo: "POST", cuerpo: {} });
    setEnviando(false);
    if (sesionVencida(respuesta.status)) return;
    if (!esOk(respuesta.datos)) {
      setError(mensajeFallo(respuesta, ERROR_GENERICO));
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {estado && <span className={claseSelloBkoPos(estado)}>{etiquetaBkoPos(estado)}</span>}
      {numBkoPos !== null && <span className="num-tab font-mono font-semibold">N° {numBkoPos}</span>}
      {compromiso && (
        <span>
          <span className="rotulo-tecnico text-[11px] text-tinta-suave">Entrega</span>{" "}
          <span className="font-semibold">{compromiso}</span>
        </span>
      )}
      {conPartidasSobrePedido && (
        // La hoja con `?imprimir=1` lanza window.print() al cargar, igual que la de surtido.
        <a
          href={`${RUTA_MOSTRADOR}/pedidos/${idPedido}/backorder?imprimir=1`}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(CLASE_BOTON_SECUNDARIO, "gap-1.5")}
        >
          <Printer aria-hidden className="size-3.5" />
          Imprimir back order
        </a>
      )}
      {conReintento && (
        <button
          type="button"
          onClick={() => void reintentar()}
          disabled={enviando}
          className={clsx(CLASE_BOTON_SECUNDARIO, "gap-1.5")}
        >
          <RefreshCw aria-hidden className={clsx("size-3.5", enviando && "animate-spin")} />
          {enviando ? "Pidiendo…" : estado === "error" ? "Reintentar" : "Pedir a Aldo"}
        </button>
      )}
      {anotacion && (
        <p className={clsx("w-full text-xs", estado === "error" ? "text-anotacion" : "text-tinta-suave")}>{anotacion}</p>
      )}
      {error && (
        <p role="alert" className={clsx(CLASE_ERROR, "w-full text-xs")}>
          {error}
        </p>
      )}
    </div>
  );
}
