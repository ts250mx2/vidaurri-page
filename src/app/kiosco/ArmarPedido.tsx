"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircleQuestion, Search, type LucideIcon } from "lucide-react";
import { ChatKiosco } from "@/components/kiosco/ChatKiosco";
import { CLASE_ERROR_KIOSCO } from "@/components/kiosco/estilos";
import { Tecla } from "@/components/kiosco/Tecla";
import { NEGOCIO } from "@/config/negocio";
import {
  esOk,
  kioscoDesactivado,
  llamarKiosco,
  mensajeFallo,
  pedidoDeRespuesta,
  type RespuestaKioscoNav,
} from "@/lib/kiosco/navegador";
import { RUTA_KIOSCO_PEDIDO } from "@/lib/kiosco/rutas";
import type { PedidoKiosco as Pedido } from "@/lib/kiosco/tipos";
import type { CapturaPartida, SucursalEntrega } from "@/lib/mostrador/tipos";
import { BuscadorKiosco } from "./BuscadorKiosco";
import { PedidoKiosco } from "./PedidoKiosco";

// El armado del pedido: la pantalla que el cliente encuentra encendida. A la
// izquierda, una sola cosa a la vez: Vico por default (el dueño lo decidió
// así, 15 sep 2026: el que llega describe la pieza como le salga) y, como
// opción, buscar por nombre o código; a la derecha, lo que lleva y el total.
// La otra forma siempre está a la vista en la tarjeta de abajo y a un F2.
//
// El borrador que tiene IA es la única verdad: cada acción le pide el borrador
// completo de vuelta y aquí solo se sustituye. Nada de sumar precios en el
// navegador, o el total del kiosco y el del mostrador acabarían discrepando.

type Modo = "buscar" | "vico";

/** La tarjeta de abajo: ofrece la otra forma de encontrar la pieza. */
function TarjetaCambio({
  icono: Icono,
  titulo,
  detalle,
  accion,
  onClick,
}: {
  icono: LucideIcon;
  titulo: string;
  detalle: string;
  accion: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="lamina lamina-enlace flex items-center gap-4 px-5 py-4 text-left"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-plano text-white">
        <Icono aria-hidden className="size-6" />
      </span>
      <span className="min-w-0">
        <span className="rotulo-tecnico block text-base text-tinta">{titulo}</span>
        <span className="mt-0.5 block text-sm text-tinta-suave">{detalle}</span>
      </span>
      <span className="rotulo-tecnico ml-auto flex shrink-0 items-center gap-2 text-sm text-tinta">
        {accion}
        <Tecla>F2</Tecla>
      </span>
    </button>
  );
}

const ERROR_AGREGAR = "No pude agregar esa pieza; inténtalo otra vez";
const ERROR_CANTIDAD = "No pude cambiar la cantidad";
const ERROR_QUITAR = "No pude quitar esa pieza";
const ERROR_VACIAR = "No pude vaciar tu pedido";
const ERROR_RELEER = "No pude leer tu pedido";

export function ArmarPedido({
  borradorInicial,
  errorInicial,
  sucursal,
}: {
  borradorInicial: Pedido | null;
  errorInicial: string | null;
  sucursal: SucursalEntrega;
}) {
  const router = useRouter();
  const [pedido, setPedido] = useState<Pedido | null>(borradorInicial);
  const [error, setError] = useState<string | null>(errorInicial);
  const [modo, setModo] = useState<Modo>("vico");
  const [ocupado, setOcupado] = useState(false);

  // F2 cambia entre Vico y el buscador desde cualquier parte de la pantalla:
  // el cliente que ya está tecleando no tiene que soltar el teclado.
  useEffect(() => {
    function atajo(evento: globalThis.KeyboardEvent) {
      if (evento.key !== "F2") return;
      evento.preventDefault();
      setModo((actual) => (actual === "vico" ? "buscar" : "vico"));
    }
    window.addEventListener("keydown", atajo);
    return () => window.removeEventListener("keydown", atajo);
  }, []);

  /** Relee el borrador de IA cuando una respuesta no lo trajo. */
  const releer = useCallback(async (): Promise<string | null> => {
    const respuesta = await llamarKiosco("/borrador");
    if (kioscoDesactivado(respuesta.status)) return null;
    if (!esOk(respuesta.datos)) return mensajeFallo(respuesta, ERROR_RELEER);
    setPedido(pedidoDeRespuesta(respuesta.datos));
    return null;
  }, []);

  /**
   * Guarda el borrador que devolvió IA. Si la respuesta salió bien pero no lo
   * trae (un motor que responda solo `{ ok: true }`), se relee en vez de dejar
   * la tarjeta desfasada: el cliente tiene que ver lo que acaba de agregar.
   */
  const aplicar = useCallback(
    async (respuesta: RespuestaKioscoNav, porDefecto: string): Promise<string | null> => {
      if (kioscoDesactivado(respuesta.status)) return null;
      if (!esOk(respuesta.datos)) return mensajeFallo(respuesta, porDefecto);
      const devuelto = pedidoDeRespuesta(respuesta.datos);
      if (devuelto) {
        setPedido(devuelto);
        return null;
      }
      return releer();
    },
    [releer]
  );

  const agregarPieza = useCallback(
    async (captura: CapturaPartida): Promise<string | null> => {
      setOcupado(true);
      setError(null);
      try {
        const respuesta = await llamarKiosco("/borrador/partidas", { cuerpo: captura });
        return await aplicar(respuesta, ERROR_AGREGAR);
      } finally {
        setOcupado(false);
      }
    },
    [aplicar]
  );

  async function cambiarCantidad(idPartida: number, cantidad: number): Promise<string | null> {
    const respuesta = await llamarKiosco(`/borrador/partidas/${idPartida}`, {
      metodo: "PATCH",
      cuerpo: { cantidad },
    });
    return aplicar(respuesta, ERROR_CANTIDAD);
  }

  async function quitarPartida(idPartida: number): Promise<string | null> {
    const respuesta = await llamarKiosco(`/borrador/partidas/${idPartida}`, { metodo: "DELETE" });
    return aplicar(respuesta, ERROR_QUITAR);
  }

  async function vaciar(): Promise<string | null> {
    const respuesta = await llamarKiosco("/borrador", { metodo: "DELETE" });
    if (kioscoDesactivado(respuesta.status)) return null;
    if (!esOk(respuesta.datos)) return mensajeFallo(respuesta, ERROR_VACIAR);
    setPedido(null);
    return null;
  }

  const recibirPedidoDeVico = useCallback((devuelto: Pedido | null) => {
    setPedido(devuelto);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p role="alert" className={CLASE_ERROR_KIOSCO}>
          {error}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-12 lg:items-stretch">
        <section
          aria-label={modo === "vico" ? `Pregúntale a ${NEGOCIO.asistente}` : "Busca tu pieza"}
          className="flex h-[calc(100vh-11.5rem)] min-h-[440px] flex-col gap-3 lg:col-span-8"
        >
          <div className="min-h-0 flex-1">
            {modo === "vico" ? (
              <ChatKiosco onPedido={recibirPedidoDeVico} onAgregar={agregarPieza} />
            ) : (
              <BuscadorKiosco
                ocupado={ocupado}
                onAgregar={agregarPieza}
                onVolverAVico={() => setModo("vico")}
              />
            )}
          </div>

          {modo === "vico" ? (
            <TarjetaCambio
              icono={Search}
              titulo="¿Ya sabes cómo se llama la pieza?"
              detalle="Búscala por nombre o por código: “FACIA VERSA”, “calavera Aveo”, “DDNVE15”."
              accion="Busca tu pieza"
              onClick={() => setModo("buscar")}
            />
          ) : (
            <TarjetaCambio
              icono={MessageCircleQuestion}
              titulo="¿No sabes cómo se llama la pieza?"
              detalle={`Descríbesela a ${NEGOCIO.asistente} como se te ocurra: “el foco de adelante de un Versa 2016”.`}
              accion={`Pregúntale a ${NEGOCIO.asistente}`}
              onClick={() => setModo("vico")}
            />
          )}
        </section>

        <aside
          aria-label="Tu pedido"
          className="h-[calc(100vh-11.5rem)] min-h-[440px] lg:col-span-4"
        >
          <PedidoKiosco
            pedido={pedido}
            ocupado={ocupado}
            sucursal={sucursal}
            onCantidad={cambiarCantidad}
            onQuitar={quitarPartida}
            onVaciar={vaciar}
            onContinuar={() => router.push(RUTA_KIOSCO_PEDIDO)}
          />
        </aside>
      </div>
    </div>
  );
}
