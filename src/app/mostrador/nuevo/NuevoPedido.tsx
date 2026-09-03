"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatMostrador } from "@/components/mostrador/ChatMostrador";
import {
  CLASE_BOTON_PLANO,
  CLASE_BOTON_SECUNDARIO,
  CLASE_ERROR,
} from "@/components/mostrador/estilos";
import {
  esOk,
  llamarProxy,
  mensajeFallo,
  pedidoDe,
  sesionVencida,
  type RespuestaProxy,
} from "@/lib/mostrador/navegador";
import type { PedidoDetalle, PerfilPos, SucursalEntrega } from "@/lib/mostrador/tipos";
import { PanelBorrador } from "./PanelBorrador";
import { PanelCliente } from "./PanelCliente";

// Orquestador de la captura: el borrador del servidor es la única verdad y
// aquí vive su copia en pantalla. Cada acción (elegir cliente, agregar o
// quitar partida, enviar) pega al proxy y sustituye el borrador completo con
// el que IA devuelve; nada se calcula en el navegador. Los paneles reciben
// callbacks que devuelven el mensaje de error (o null) y pintan el suyo.

export interface PropsNuevoPedido {
  borradorInicial: PedidoDetalle | null;
  perfil: PerfilPos;
  vendedor: string;
  errorInicial: string | null;
}

/** Resultado de una acción: null si salió bien, si no el texto para el vendedor. */
export type ResultadoAccion = Promise<string | null>;

const SUCURSAL_CASA: SucursalEntrega = "matriz";
const CLIENTE_PUBLICO = "Público general";
const ERROR_BORRADOR = "No fue posible abrir el borrador";
const ERROR_PARTIDA = "No fue posible agregar la pieza";
const ERROR_QUITAR = "No fue posible quitar la partida";
const ERROR_ENVIAR = "No fue posible enviar el pedido";
const ERROR_CANCELAR = "No fue posible cancelar el borrador";

interface Intento {
  idCliente: number | null;
  sucursal: SucursalEntrega;
}

/** Un borrador con partidas para otro cliente estorba: IA lo devuelve en el 409. */
interface Choque {
  pedido: PedidoDetalle;
  intento: Intento;
}

function rutaPedido(id: number): string {
  return `/mostrador/pedidos/${id}`;
}

export function NuevoPedido({ borradorInicial, perfil, vendedor, errorInicial }: PropsNuevoPedido) {
  const router = useRouter();
  const [borrador, setBorrador] = useState<PedidoDetalle | null>(borradorInicial);
  const [choque, setChoque] = useState<Choque | null>(null);
  const [error, setError] = useState<string | null>(errorInicial);
  const [ocupado, setOcupado] = useState(false);

  const idCliente = borrador?.idCliente ?? null;
  const sucursal = borrador?.sucursal ?? SUCURSAL_CASA;

  /** Guarda el pedido que IA devolvió; si la respuesta no trae uno, devuelve el error. */
  function tomarPedido(respuesta: RespuestaProxy, porDefecto: string): string | null {
    if (sesionVencida(respuesta.status)) return null;
    const pedido = pedidoDe(respuesta.datos);
    if (!esOk(respuesta.datos) || !pedido) return mensajeFallo(respuesta, porDefecto);
    setBorrador(pedido);
    return null;
  }

  /** POST /borrador: crea el borrador o reutiliza el del mismo cliente (cambiando sucursal). */
  const abrirBorrador = useCallback(async (intento: Intento): Promise<PedidoDetalle | null> => {
    setOcupado(true);
    setError(null);
    try {
      const respuesta = await llamarProxy("/borrador", { cuerpo: intento });
      if (sesionVencida(respuesta.status)) return null;
      const pedido = pedidoDe(respuesta.datos);
      if (respuesta.status === 409 && pedido) {
        setChoque({ pedido, intento });
        return null;
      }
      if (!esOk(respuesta.datos) || !pedido) {
        setError(mensajeFallo(respuesta, ERROR_BORRADOR));
        return null;
      }
      setBorrador(pedido);
      return pedido;
    } finally {
      setOcupado(false);
    }
  }, []);

  async function elegirCliente(idNuevo: number | null): Promise<void> {
    await abrirBorrador({ idCliente: idNuevo, sucursal });
  }

  async function cambiarSucursal(sucursalNueva: SucursalEntrega): Promise<void> {
    await abrirBorrador({ idCliente, sucursal: sucursalNueva });
  }

  /** Tira el borrador que estorba y repite la selección que provocó el 409. */
  async function cancelarYCambiar(): Promise<void> {
    if (!choque) return;
    const { intento } = choque;
    setChoque(null);
    const fallo = await cancelarBorrador();
    if (fallo) {
      setError(fallo);
      return;
    }
    await abrirBorrador(intento);
  }

  /** Sin cliente elegido la captura va a público general, como en el mostrador físico. */
  async function asegurarBorrador(): Promise<PedidoDetalle | null> {
    if (borrador) return borrador;
    return abrirBorrador({ idCliente: null, sucursal });
  }

  async function agregarPartida(codigo: string, cantidad: number): ResultadoAccion {
    const actual = await asegurarBorrador();
    if (!actual) return ERROR_BORRADOR;
    const respuesta = await llamarProxy("/borrador/partidas", {
      cuerpo: { origen: "nueva", codigo, idPiezaUsada: null, cantidad },
    });
    return tomarPedido(respuesta, ERROR_PARTIDA);
  }

  async function quitarPartida(idPartida: number): ResultadoAccion {
    const respuesta = await llamarProxy(`/borrador/partidas/${idPartida}`, { metodo: "DELETE" });
    return tomarPedido(respuesta, ERROR_QUITAR);
  }

  async function enviarPedido(observaciones: string): ResultadoAccion {
    const respuesta = await llamarProxy("/borrador/enviar", {
      cuerpo: { observaciones: observaciones.trim() || null, sucursal },
    });
    if (sesionVencida(respuesta.status)) return null;
    const pedido = pedidoDe(respuesta.datos);
    if (!esOk(respuesta.datos) || !pedido) return mensajeFallo(respuesta, ERROR_ENVIAR);
    router.push(rutaPedido(pedido.id));
    return null;
  }

  async function cancelarBorrador(): ResultadoAccion {
    const respuesta = await llamarProxy("/borrador", { metodo: "DELETE" });
    if (sesionVencida(respuesta.status)) return null;
    if (!esOk(respuesta.datos)) return mensajeFallo(respuesta, ERROR_CANCELAR);
    setBorrador(null);
    return null;
  }

  /**
   * Lo que Vico deja tras cada turno. Si viene null y había borrador, Vico lo
   * cerró: se relee ese pedido y, si ya quedó enviado, se salta a su ficha
   * para que el vendedor vea el folio; si lo canceló, la tarjeta se vacía.
   */
  const recibirPedidoDeVico = useCallback(
    async (pedido: PedidoDetalle | null) => {
      if (pedido) {
        setBorrador(pedido);
        return;
      }
      const idPrevio = borrador?.id;
      setBorrador(null);
      if (!idPrevio) return;
      const respuesta = await llamarProxy(`/pedidos/${idPrevio}`);
      const cerrado = pedidoDe(respuesta.datos);
      if (cerrado?.estatus === "enviado") router.push(rutaPedido(cerrado.id));
    },
    [borrador?.id, router]
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="rotulo-tecnico text-xs text-tinta-suave">
            Mostrador · {vendedor} · {perfil}
          </p>
          <h1 className="titulo-lamina mt-1 text-3xl">Nuevo pedido</h1>
        </div>
        <p className="max-w-xl text-sm leading-relaxed text-tinta-suave">
          Elige al cliente, pídele las piezas a Vico o agrégalas a mano, y envía el
          pedido para que el mostrador confirme la existencia.
        </p>
      </header>

      {error && (
        <p role="alert" className={`${CLASE_ERROR} rounded-md border border-anotacion bg-hoja px-4 py-3`}>
          {error}
        </p>
      )}

      {choque && (
        <div role="alert" className="lamina flex flex-col gap-3 border-anotacion px-4 py-4 sm:flex-row sm:items-center">
          <p className="flex-1 text-sm text-tinta">
            Ya tienes un pedido en captura para <strong>{choque.pedido.cliente}</strong>; envíalo
            o cancélalo antes de cambiar de cliente.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setChoque(null)}
              disabled={ocupado}
              className={CLASE_BOTON_PLANO}
            >
              Seguir con {choque.pedido.cliente}
            </button>
            <button
              type="button"
              onClick={() => void cancelarYCambiar()}
              disabled={ocupado}
              className={`${CLASE_BOTON_SECUNDARIO} text-anotacion`}
            >
              Cancelar ese borrador y cambiar
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <section aria-label="Cliente" className="lg:col-span-3">
          <PanelCliente
            borrador={borrador}
            ocupado={ocupado}
            clientePublico={CLIENTE_PUBLICO}
            onElegir={elegirCliente}
            onSucursal={cambiarSucursal}
          />
        </section>
        <section aria-label={`Chat con Vico`} className="lg:col-span-5">
          <ChatMostrador idCliente={idCliente} sucursal={sucursal} onPedido={recibirPedidoDeVico} />
        </section>
        <section aria-label="Pedido en captura" className="lg:col-span-4">
          <PanelBorrador
            borrador={borrador}
            ocupado={ocupado}
            clientePublico={CLIENTE_PUBLICO}
            onAgregar={agregarPartida}
            onQuitar={quitarPartida}
            onEnviar={enviarPedido}
            onCancelar={cancelarBorrador}
          />
        </section>
      </div>
    </div>
  );
}
