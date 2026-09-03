"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { esOk, llamarProxy, mensajeFallo, sesionVencida } from "@/lib/mostrador/navegador";
import { transicionesPermitidas } from "@/lib/mostrador/reglas";
import type { EstatusPedido, PerfilPos } from "@/lib/mostrador/tipos";

// Botones de estatus del pedido. Solo se pintan los que la matriz
// `puedeCambiarEstatus` permite al perfil de la sesión (copia local para
// pintar; IA vuelve a decidir y responde 403 si la copia se desfasó).
// Entregar pide el folio de la venta del POS y cancelar pide el motivo, en un
// modal simple; los demás van directo. Tras el cambio, router.refresh() vuelve
// a pedir la página al servidor con el pedido ya movido. Un 401 (cookie
// vencida o revocada a media pantalla) no se pinta como error: `sesionVencida`
// cierra sesión y manda a login con vuelta a este pedido.

const MOTIVO_MAX = 200;
const FOLIO_VENTA_POS_MAX = 20;
const ERROR_GENERICO = "No fue posible cambiar el estatus; intenta de nuevo";

type Destino = Exclude<EstatusPedido, "borrador" | "enviado">;

interface Accion {
  destino: Destino;
  etiqueta: string;
  clase: string;
  /** Qué pregunta el modal antes de mandar; sin modal va directo. */
  captura?: "folioVentaPos" | "motivo";
}

const CLASE_BOTON =
  "rotulo-tecnico inline-flex h-12 items-center rounded-md px-5 text-sm transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60";
const CLASE_AMBAR = `${CLASE_BOTON} bg-ambar text-plano-hondo hover:bg-ambar-press active:bg-ambar-press`;
const CLASE_PLANO = `${CLASE_BOTON} border border-tinta bg-plano text-white hover:bg-plano-hondo`;
const CLASE_NEUTRO = `${CLASE_BOTON} border border-linea bg-hoja text-tinta hover:border-tinta`;
const CLASE_ROJO = `${CLASE_BOTON} border border-anotacion bg-hoja text-anotacion hover:bg-anotacion hover:text-white`;

/** Ámbar solo para confirmar (la acción que destraba el pedido); avanzar en tinta; cancelar en rojo. */
const ACCIONES: Readonly<Record<Destino, Accion>> = {
  confirmado: { destino: "confirmado", etiqueta: "Confirmar pedido", clase: CLASE_AMBAR },
  listo: { destino: "listo", etiqueta: "Marcar listo", clase: CLASE_PLANO },
  entregado: { destino: "entregado", etiqueta: "Entregar", clase: CLASE_PLANO, captura: "folioVentaPos" },
  cancelado: { destino: "cancelado", etiqueta: "Cancelar pedido", clase: CLASE_ROJO, captura: "motivo" },
};

function esDestino(estatus: EstatusPedido): estatus is Destino {
  return estatus in ACCIONES;
}

/** Modal mínimo: un campo y dos botones. Escape cierra; el foco arranca en el campo. */
function ModalCaptura({
  accion,
  enviando,
  error,
  onCancelar,
  onConfirmar,
}: {
  accion: Accion;
  enviando: boolean;
  error: string | null;
  onCancelar: () => void;
  onConfirmar: (valor: string) => void;
}) {
  const [valor, setValor] = useState("");
  const idTitulo = useId();
  const idCampo = useId();
  const pideMotivo = accion.captura === "motivo";

  useEffect(() => {
    function alTeclear(evento: KeyboardEvent) {
      if (evento.key === "Escape") onCancelar();
    }
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onCancelar]);

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    onConfirmar(valor.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-plano-hondo/60 p-4" onClick={onCancelar}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        onSubmit={enviar}
        onClick={(e) => e.stopPropagation()}
        className="lamina w-full max-w-md p-6 shadow-lamina-alta"
      >
        <p className="rotulo-tecnico text-xs text-tinta-suave">{pideMotivo ? "Cancelar pedido" : "Entregar pedido"}</p>
        <h2 id={idTitulo} className="titulo-lamina mt-1 text-2xl">
          {pideMotivo ? "¿Por qué se cancela?" : "Folio de venta del POS"}
        </h2>
        <label htmlFor={idCampo} className="mt-4 block text-sm text-tinta-suave">
          {pideMotivo
            ? "El motivo queda en la bitácora del pedido."
            : "Anota el folio con que se cobró en el punto de venta (opcional, solo referencia)."}
        </label>
        {pideMotivo ? (
          <textarea
            id={idCampo}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            maxLength={MOTIVO_MAX}
            rows={3}
            autoFocus
            required
            className="mt-2 w-full rounded-md border border-linea bg-papel px-3 py-2 text-base text-tinta outline-none transition-colors duration-150 focus:border-tinta"
          />
        ) : (
          <input
            id={idCampo}
            type="text"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            maxLength={FOLIO_VENTA_POS_MAX}
            autoFocus
            autoCapitalize="characters"
            className="num-tab mt-2 h-12 w-full rounded-md border border-linea bg-papel px-3 font-mono text-base text-tinta outline-none transition-colors duration-150 focus:border-tinta"
          />
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-anotacion">
            {error}
          </p>
        )}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onCancelar} disabled={enviando} className={CLASE_NEUTRO}>
            Volver
          </button>
          <button
            type="submit"
            disabled={enviando || (pideMotivo && !valor.trim())}
            className={pideMotivo ? CLASE_ROJO : CLASE_PLANO}
          >
            {enviando ? "Guardando…" : accion.etiqueta}
          </button>
        </div>
      </form>
    </div>
  );
}

export function AccionesPedido({
  idPedido,
  estatus,
  perfil,
}: {
  idPedido: number;
  estatus: EstatusPedido;
  perfil: PerfilPos;
}) {
  const router = useRouter();
  const [abierta, setAbierta] = useState<Accion | null>(null);
  const [enviando, setEnviando] = useState<Destino | null>(null);
  const [error, setError] = useState<string | null>(null);

  const acciones = transicionesPermitidas(perfil, estatus).filter(esDestino).map((destino) => ACCIONES[destino]);
  if (acciones.length === 0) return null;

  async function cambiar(accion: Accion, valor: string | null) {
    if (enviando) return;
    setEnviando(accion.destino);
    setError(null);
    const respuesta = await llamarProxy(`/pedidos/${idPedido}/estatus`, {
      cuerpo: {
        estatus: accion.destino,
        motivo: accion.captura === "motivo" ? valor : null,
        folioVentaPos: accion.captura === "folioVentaPos" ? valor || null : null,
      },
    });
    setEnviando(null);
    if (sesionVencida(respuesta.status)) return;
    if (!esOk(respuesta.datos)) {
      setError(mensajeFallo(respuesta, ERROR_GENERICO));
      return;
    }
    setAbierta(null);
    router.refresh();
  }

  function pulsar(accion: Accion) {
    setError(null);
    if (accion.captura) {
      setAbierta(accion);
      return;
    }
    void cambiar(accion, null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {acciones.map((accion) => (
          <button
            key={accion.destino}
            type="button"
            onClick={() => pulsar(accion)}
            disabled={enviando !== null}
            className={clsx(accion.clase, accion.destino === "cancelado" && "sm:ml-auto")}
          >
            {enviando === accion.destino && !abierta ? "Guardando…" : accion.etiqueta}
          </button>
        ))}
      </div>
      {error && !abierta && (
        <p role="alert" className="text-sm font-medium text-anotacion">
          {error}
        </p>
      )}
      {abierta && (
        <ModalCaptura
          accion={abierta}
          enviando={enviando !== null}
          error={error}
          onCancelar={() => {
            if (!enviando) setAbierta(null);
          }}
          onConfirmar={(valor) => void cambiar(abierta, valor)}
        />
      )}
    </div>
  );
}
