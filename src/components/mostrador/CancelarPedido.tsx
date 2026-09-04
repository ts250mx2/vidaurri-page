"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type MouseEvent, type SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { CLASE_BOTON_PELIGRO, CLASE_BOTON_SECUNDARIO, CLASE_ERROR } from "@/components/mostrador/estilos";
import { esOk, llamarProxy, mensajeFallo, sesionVencida } from "@/lib/mostrador/navegador";

// El bote de cancelar un pedido, con su diálogo de advertencia. Es la misma
// isla en la cola (solo el icono, `compacto`) y en la barra del detalle
// (icono + "Cancelar"): un solo sitio decide cómo se cancela. Quién puede
// cancelar lo decide el padre con `puedeCambiarEstatus` antes de pintarla; IA
// vuelve a decidir y responde 403 si la copia local se desfasó.
//
// Es un <dialog> nativo con showModal(): el navegador atrapa el foco, pinta
// el fondo y cierra con Escape sin código propio; aquí solo se sincroniza con
// el estado de React y se bloquea el cierre mientras se está mandando. El
// motivo es obligatorio: queda en la bitácora y no hay forma de deshacer.

const MOTIVO_MAX = 200;
const ERROR_GENERICO = "No fue posible cancelar el pedido; intenta de nuevo";

const CLASE_BOTE_COMPACTO =
  "inline-flex size-10 items-center justify-center rounded-md border border-transparent text-tinta-suave transition-colors duration-150 hover:border-anotacion hover:bg-hoja hover:text-anotacion";
/** Misma tinta roja que CLASE_BOTON_PELIGRO, a la altura (h-12) de los demás botones de la barra. */
const CLASE_BOTE_BARRA = twMerge(CLASE_BOTON_PELIGRO, "h-12 gap-2 px-4 text-sm");
const CLASE_CERRAR =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-md text-tinta-suave transition-colors duration-150 hover:bg-papel hover:text-tinta";
const CLASE_MOTIVO =
  "mt-2 w-full rounded-md border border-linea bg-papel px-3 py-2 text-base text-tinta outline-none transition-colors duration-150 focus:border-tinta disabled:opacity-60";

interface Props {
  idPedido: number;
  /** 'P-000131' (o el id) para el título del diálogo. */
  folio: string;
  /** Solo el icono, para el renglón de la cola; en la barra del detalle lleva texto. */
  compacto?: boolean;
}

export function CancelarPedido({ idPedido, folio, compacto = false }: Props) {
  const router = useRouter();
  const dialogo = useRef<HTMLDialogElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idTitulo = useId();
  const idTexto = useId();
  const idCampo = useId();

  // showModal() solo se puede llamar con el <dialog> ya en el DOM: por eso va
  // en un efecto y no en el onClick. El foco arranca en el motivo, que es lo
  // único que hay que llenar.
  useEffect(() => {
    const el = dialogo.current;
    if (!el) return;
    if (abierto && !el.open) {
      el.showModal();
      campo.current?.focus();
    } else if (!abierto && el.open) {
      el.close();
    }
  }, [abierto]);

  function abrir() {
    setMotivo("");
    setError(null);
    setAbierto(true);
  }

  function cerrar() {
    if (!enviando) setAbierto(false);
  }

  /** Escape: el navegador pide cerrar; se le dice que no mientras se manda. */
  function alPedirCierre(evento: SyntheticEvent<HTMLDialogElement>) {
    evento.preventDefault();
    cerrar();
  }

  /** Un clic en el fondo (el propio <dialog>, fuera del formulario) también cierra. */
  function alClicFondo(evento: MouseEvent<HTMLDialogElement>) {
    if (evento.target === dialogo.current) cerrar();
  }

  async function confirmar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const texto = motivo.trim();
    if (!texto || enviando) return;
    setEnviando(true);
    setError(null);
    const respuesta = await llamarProxy(`/pedidos/${idPedido}/estatus`, {
      cuerpo: { estatus: "cancelado", motivo: texto },
    });
    setEnviando(false);
    if (sesionVencida(respuesta.status)) return;
    if (!esOk(respuesta.datos)) {
      setError(mensajeFallo(respuesta, ERROR_GENERICO));
      return;
    }
    setAbierto(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        aria-label="Cancelar pedido"
        title="Cancelar pedido"
        className={compacto ? CLASE_BOTE_COMPACTO : CLASE_BOTE_BARRA}
      >
        <Trash2 aria-hidden className="size-4" />
        {!compacto && "Cancelar"}
      </button>

      <dialog
        ref={dialogo}
        aria-labelledby={idTitulo}
        aria-describedby={idTexto}
        onCancel={alPedirCierre}
        onClose={() => setAbierto(false)}
        onClick={alClicFondo}
        className="lamina m-auto w-[calc(100%-2rem)] max-w-md p-0 text-tinta shadow-lamina-alta backdrop:bg-plano-hondo/60"
      >
        <form onSubmit={confirmar} className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="rotulo-tecnico text-xs text-anotacion">Cancelar pedido</p>
              <h2 id={idTitulo} className="titulo-lamina num-tab mt-1 text-2xl">
                ¿Cancelar el pedido {folio}?
              </h2>
            </div>
            <button type="button" onClick={cerrar} disabled={enviando} aria-label="Cerrar" className={CLASE_CERRAR}>
              <X aria-hidden className="size-5" />
            </button>
          </div>

          <p id={idTexto} className="mt-3 text-sm text-tinta-suave">
            El pedido se marca como cancelado y queda en la bitácora; no se puede deshacer.
          </p>

          <label htmlFor={idCampo} className="rotulo-tecnico mt-4 block text-xs text-tinta-suave">
            Motivo
          </label>
          <textarea
            id={idCampo}
            ref={campo}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={MOTIVO_MAX}
            rows={3}
            required
            disabled={enviando}
            placeholder="Qué pasó: el cliente ya no la quiere, no llegó la pieza…"
            className={CLASE_MOTIVO}
          />
          <p className="num-tab mt-1 text-right font-mono text-xs text-tinta-suave" aria-hidden>
            {motivo.length}/{MOTIVO_MAX}
          </p>

          {error && (
            <p role="alert" className={`${CLASE_ERROR} mt-2`}>
              {error}
            </p>
          )}

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={cerrar} disabled={enviando} className={CLASE_BOTON_SECUNDARIO}>
              No, volver
            </button>
            <button type="submit" disabled={enviando || !motivo.trim()} className={CLASE_BOTON_PELIGRO}>
              {enviando ? "Cancelando…" : "Sí, cancelar"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
