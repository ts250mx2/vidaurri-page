"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { pesos } from "@/lib/formato";
import { ETIQUETA_ESTATUS_PARTIDA, ETIQUETA_ORIGEN, ORDEN_ESTATUS_PARTIDA } from "@/lib/mostrador/etiquetas";
import { esOk, llamarProxy, mensajeFallo, sesionVencida } from "@/lib/mostrador/navegador";
import type { EstatusPartida, PartidaPedido } from "@/lib/mostrador/tipos";
import { CLASE_TD_PARTIDA, CLASE_TH_PARTIDA, referenciaPartida } from "./TablaPartidas";

// Confirmación por renglón mientras el pedido está enviado o confirmado: el
// mostrador va al anaquel y anota qué encontró de cada pieza (confirmada, sin
// existencia, sobre pedido con días). Se manda todo junto a
// /api/mostrador/pedidos/[id]/partidas/confirmar; IA vuelve a validar y no
// toca el estatus del pedido, que se mueve con los botones de AccionesPedido.
// Un 401 a media confirmación (cookie vencida o revocada) no es un error que
// pintar: `sesionVencida` cierra sesión y manda a login con vuelta aquí.

const DIAS_ENTREGA_MAX = 365;
const NOTA_MAX = 200;
const ERROR_GENERICO = "No fue posible guardar la confirmación; intenta de nuevo";

const CLASE_CAMPO =
  "h-11 w-full rounded-md border border-linea bg-papel px-2.5 text-base text-tinta transition-colors duration-150 hover:border-linea-fuerte focus:border-tinta disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-linea";

interface RenglonEdicion {
  id: number;
  estatusPartida: EstatusPartida;
  /** Texto del input; se convierte a número solo al enviar. */
  diasEntrega: string;
  nota: string;
}

function esEstatusPartida(x: string): x is EstatusPartida {
  return (ORDEN_ESTATUS_PARTIDA as ReadonlyArray<string>).includes(x);
}

function renglonInicial(partida: PartidaPedido): RenglonEdicion {
  return {
    id: partida.id,
    estatusPartida: partida.estatusPartida,
    diasEntrega: partida.diasEntrega === null ? "" : String(partida.diasEntrega),
    nota: partida.nota ?? "",
  };
}

/** Validación previa en pantalla, con el mismo criterio que IA, para no viajar de balde. */
function validarRenglones(renglones: RenglonEdicion[]): string | null {
  for (const [indice, renglon] of renglones.entries()) {
    if (renglon.estatusPartida !== "sobre_pedido") continue;
    const dias = Number.parseInt(renglon.diasEntrega, 10);
    if (!Number.isInteger(dias) || dias < 1 || dias > DIAS_ENTREGA_MAX) {
      return `Partida ${indice + 1}: anota los días de entrega (1 a ${DIAS_ENTREGA_MAX}) para el sobre pedido`;
    }
  }
  return null;
}

export function ConfirmacionPartidas({ idPedido, partidas }: { idPedido: number; partidas: PartidaPedido[] }) {
  const router = useRouter();
  const [renglones, setRenglones] = useState<RenglonEdicion[]>(() => partidas.map(renglonInicial));
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  function actualizar(id: number, cambio: Partial<RenglonEdicion>) {
    setRenglones((previos) => previos.map((r) => (r.id === id ? { ...r, ...cambio } : r)));
    setGuardado(false);
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    const problema = validarRenglones(renglones);
    if (problema) {
      setError(problema);
      return;
    }
    setEnviando(true);
    setError(null);
    const respuesta = await llamarProxy(`/pedidos/${idPedido}/partidas/confirmar`, {
      cuerpo: {
        partidas: renglones.map((r) => ({
          id: r.id,
          estatusPartida: r.estatusPartida,
          diasEntrega: r.estatusPartida === "sobre_pedido" ? Number.parseInt(r.diasEntrega, 10) : null,
          nota: r.nota.trim() || null,
        })),
      },
    });
    setEnviando(false);
    if (sesionVencida(respuesta.status)) return;
    if (!esOk(respuesta.datos)) {
      setError(mensajeFallo(respuesta, ERROR_GENERICO));
      return;
    }
    setGuardado(true);
    router.refresh();
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-3" aria-label="Confirmación de partidas">
      <div className="lamina overflow-x-auto">
        <table className="w-full min-w-[1080px] border-collapse">
          <thead className="bg-papel">
            <tr>
              <th scope="col" className={CLASE_TH_PARTIDA}>#</th>
              <th scope="col" className={CLASE_TH_PARTIDA}>Origen</th>
              <th scope="col" className={CLASE_TH_PARTIDA}>Código</th>
              <th scope="col" className={CLASE_TH_PARTIDA}>Descripción</th>
              <th scope="col" className={clsx(CLASE_TH_PARTIDA, "text-right")}>Cant.</th>
              <th scope="col" className={clsx(CLASE_TH_PARTIDA, "text-right")}>Importe (IVA incluido)</th>
              <th scope="col" className={clsx(CLASE_TH_PARTIDA, "text-right")}>Exist. al pedir</th>
              <th scope="col" className={CLASE_TH_PARTIDA}>Estatus</th>
              <th scope="col" className={CLASE_TH_PARTIDA}>Días</th>
              <th scope="col" className={CLASE_TH_PARTIDA}>Nota</th>
            </tr>
          </thead>
          <tbody>
            {partidas.map((partida, indice) => {
              const renglon = renglones[indice] ?? renglonInicial(partida);
              const sobrePedido = renglon.estatusPartida === "sobre_pedido";
              return (
                <tr key={partida.id} className="border-t border-linea">
                  <td className={clsx(CLASE_TD_PARTIDA, "num-tab font-mono text-sm text-tinta-suave")}>{partida.partida}</td>
                  <td className={clsx(CLASE_TD_PARTIDA, "whitespace-nowrap text-sm")}>{ETIQUETA_ORIGEN[partida.origen]}</td>
                  <td className={clsx(CLASE_TD_PARTIDA, "num-tab whitespace-nowrap font-mono text-sm font-semibold")}>
                    {referenciaPartida(partida)}
                  </td>
                  <td className={clsx(CLASE_TD_PARTIDA, "min-w-56 text-sm")}>
                    {partida.descripcion}
                    <p className="num-tab mt-0.5 font-mono text-xs text-tinta-suave">{pesos(partida.precioUnitario)} c/u · IVA incluido</p>
                  </td>
                  <td className={clsx(CLASE_TD_PARTIDA, "num-tab text-right font-mono text-sm")}>{partida.cantidad}</td>
                  <td className={clsx(CLASE_TD_PARTIDA, "num-tab whitespace-nowrap text-right font-mono text-sm font-semibold")}>
                    {pesos(partida.importe)}
                  </td>
                  <td className={clsx(CLASE_TD_PARTIDA, "num-tab text-right font-mono text-sm text-tinta-suave")}>
                    {partida.existenciaAlPedir ?? "—"}
                  </td>
                  <td className={clsx(CLASE_TD_PARTIDA, "min-w-44")}>
                    <label className="sr-only" htmlFor={`estatus-${partida.id}`}>
                      Estatus de la partida {partida.partida}
                    </label>
                    <select
                      id={`estatus-${partida.id}`}
                      value={renglon.estatusPartida}
                      onChange={(e) => {
                        const valor = e.target.value;
                        if (esEstatusPartida(valor)) actualizar(partida.id, { estatusPartida: valor });
                      }}
                      className={CLASE_CAMPO}
                    >
                      {ORDEN_ESTATUS_PARTIDA.map((estatus) => (
                        <option key={estatus} value={estatus}>
                          {ETIQUETA_ESTATUS_PARTIDA[estatus]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={clsx(CLASE_TD_PARTIDA, "w-24")}>
                    <label className="sr-only" htmlFor={`dias-${partida.id}`}>
                      Días de entrega de la partida {partida.partida}
                    </label>
                    <input
                      id={`dias-${partida.id}`}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={DIAS_ENTREGA_MAX}
                      step={1}
                      value={sobrePedido ? renglon.diasEntrega : ""}
                      onChange={(e) => actualizar(partida.id, { diasEntrega: e.target.value })}
                      disabled={!sobrePedido}
                      placeholder={sobrePedido ? "días" : "—"}
                      className={clsx(CLASE_CAMPO, "num-tab font-mono")}
                    />
                  </td>
                  <td className={clsx(CLASE_TD_PARTIDA, "min-w-52")}>
                    <label className="sr-only" htmlFor={`nota-${partida.id}`}>
                      Nota de la partida {partida.partida}
                    </label>
                    <input
                      id={`nota-${partida.id}`}
                      type="text"
                      value={renglon.nota}
                      onChange={(e) => actualizar(partida.id, { nota: e.target.value })}
                      maxLength={NOTA_MAX}
                      placeholder="Opcional"
                      className={CLASE_CAMPO}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={enviando}
          className="rotulo-tecnico inline-flex h-12 items-center rounded-md border border-tinta bg-plano px-5 text-sm text-white transition-colors duration-150 hover:bg-plano-hondo disabled:cursor-not-allowed disabled:opacity-60"
        >
          {enviando ? "Guardando…" : "Guardar confirmación"}
        </button>
        {error && (
          <p role="alert" className="text-sm font-medium text-anotacion">
            {error}
          </p>
        )}
        {guardado && !error && (
          <p role="status" className="text-sm font-medium text-existencia">
            Confirmación guardada
          </p>
        )}
      </div>
    </form>
  );
}
