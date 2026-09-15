"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  MessageCircleQuestion,
  ReceiptText,
  Search,
  type LucideIcon,
} from "lucide-react";
import { useArea } from "@/components/kiosco/AreaContext";
import { ChatKiosco } from "@/components/kiosco/ChatKiosco";
import { CLASE_BOTON_AMBAR_KIOSCO, CLASE_ERROR_KIOSCO } from "@/components/kiosco/estilos";
import { Tecla } from "@/components/kiosco/Tecla";
import { NEGOCIO } from "@/config/negocio";
import { pesos } from "@/lib/formato";
import {
  esOk,
  llamarArea,
  mensajeFallo,
  pedidoDeRespuesta,
  sesionPerdida,
  type RespuestaKioscoNav,
} from "@/lib/kiosco/navegador";
import type { PedidoKiosco as Pedido } from "@/lib/kiosco/tipos";
import type { CapturaPartida, SucursalEntrega } from "@/lib/mostrador/tipos";
import { BuscadorKiosco } from "./BuscadorKiosco";
import { PedidoKiosco } from "./PedidoKiosco";

// El armado del pedido, la misma pantalla en el kiosco de la tienda y en el
// área de clientes (el área la dice el contexto). Una sola cosa a la vez:
// Vico por default (el dueño lo decidió así, 15 sep 2026: el que llega
// describe la pieza como le salga) y, como opción, buscar por nombre o
// código; la otra forma siempre está a la vista en la tarjeta de abajo (y a
// un F2 donde hay teclado).
//
// Móvil primero (390 px): una sola columna con el chat o el buscador, y el
// pedido como barra fija abajo —piezas, total y Continuar— que al tocarla
// abre la lista completa como una hoja. Desde `lg` (el kiosco a 1366×768, o
// el cliente en su PC) el pedido es la columna de la derecha, siempre a la
// vista.
//
// El borrador que tiene IA es la única verdad: cada acción le pide el borrador
// completo de vuelta y aquí solo se sustituye. Nada de sumar precios en el
// navegador, o el total de la pantalla y el del mostrador acabarían discrepando.

type Modo = "buscar" | "vico";

/** La tarjeta de abajo: ofrece la otra forma de encontrar la pieza. */
function TarjetaCambio({
  icono: Icono,
  titulo,
  detalle,
  accion,
  conTecla,
  onClick,
}: {
  icono: LucideIcon;
  titulo: string;
  detalle: string;
  accion: string;
  conTecla: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="lamina lamina-enlace flex items-center gap-3 px-4 py-3 text-left sm:gap-4 sm:px-5 sm:py-4"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-plano text-white sm:size-12">
        <Icono aria-hidden className="size-5 sm:size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="rotulo-tecnico block text-sm text-tinta sm:text-base">{titulo}</span>
        <span className="mt-0.5 hidden text-sm text-tinta-suave sm:block">{detalle}</span>
      </span>
      <span className="rotulo-tecnico flex shrink-0 items-center gap-2 text-xs text-tinta sm:text-sm">
        <span className="hidden sm:inline">{accion}</span>
        {conTecla ? <Tecla>F2</Tecla> : <ChevronRight aria-hidden className="size-5" />}
      </span>
    </button>
  );
}

/**
 * La barra fija de abajo en el celular: cuántas piezas lleva, el total con
 * IVA y Continuar. Tocar la parte izquierda abre la hoja con el pedido
 * completo. Es la ÚNICA superficie donde el pedido vive en móvil, así que el
 * ámbar de Continuar va aquí y no se repite arriba.
 */
function BarraPedidoMovil({
  pedido,
  bloqueado,
  onVer,
  onContinuar,
}: {
  pedido: Pedido | null;
  bloqueado: boolean;
  onVer: () => void;
  onContinuar: () => void;
}) {
  const piezas = pedido?.piezas ?? 0;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-linea bg-hoja pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgb(10_24_38/0.12)] lg:hidden">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <button
          type="button"
          onClick={onVer}
          aria-label={`Ver tu pedido: ${piezas} ${piezas === 1 ? "pieza" : "piezas"}, ${pesos(pedido?.total ?? 0)}`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1 pl-1 pr-2 text-left transition-colors duration-150 hover:bg-papel"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-plano text-white">
            <ReceiptText aria-hidden className="size-5" />
          </span>
          <span className="min-w-0">
            {/* `whitespace-nowrap!`: el rótulo trae `text-wrap: balance` sin capa y
                partiría "Tu pedido · 1 pieza" en dos renglones. */}
            <span className="rotulo-tecnico block truncate whitespace-nowrap! text-xs text-tinta-suave">
              Tu pedido · {piezas} {piezas === 1 ? "pieza" : "piezas"}
            </span>
            <span className="num-tab flex items-baseline gap-1.5 font-mono text-xl font-bold text-tinta">
              {pesos(pedido?.total ?? 0)}
              <span className="font-sans text-[11px] font-normal text-tinta-suave">IVA incl.</span>
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={onContinuar}
          disabled={bloqueado || piezas === 0}
          className={`${CLASE_BOTON_AMBAR_KIOSCO} h-12 shrink-0 px-4 text-sm sm:h-12 sm:text-sm`}
        >
          Continuar
          <ArrowRight aria-hidden className="size-4" />
        </button>
      </div>
    </div>
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
  nombreCliente,
}: {
  borradorInicial: Pedido | null;
  errorInicial: string | null;
  /** Sucursal del aparato (kiosco); null cuando el cliente la elige al enviar. */
  sucursal: SucursalEntrega | null;
  /** Nombre del cliente del padrón que entró; null = público general. */
  nombreCliente: string | null;
}) {
  const area = useArea();
  const router = useRouter();
  const [pedido, setPedido] = useState<Pedido | null>(borradorInicial);
  const [error, setError] = useState<string | null>(errorInicial);
  const [modo, setModo] = useState<Modo>("vico");
  const [ocupado, setOcupado] = useState(false);
  /** La hoja del pedido en móvil; en pantalla grande el pedido siempre está a la vista. */
  const [hojaAbierta, setHojaAbierta] = useState(false);

  // F2 cambia entre Vico y el buscador desde cualquier parte de la pantalla
  // (donde hay teclado): el cliente que ya está tecleando no lo suelta.
  // Escape cierra la hoja del pedido si estaba abierta.
  useEffect(() => {
    function atajo(evento: globalThis.KeyboardEvent) {
      if (evento.key === "Escape" && hojaAbierta) {
        evento.preventDefault();
        setHojaAbierta(false);
        return;
      }
      if (evento.key !== "F2" || !area.conTeclado) return;
      evento.preventDefault();
      setModo((actual) => (actual === "vico" ? "buscar" : "vico"));
    }
    window.addEventListener("keydown", atajo);
    return () => window.removeEventListener("keydown", atajo);
  }, [area.conTeclado, hojaAbierta]);

  /** Relee el borrador de IA cuando una respuesta no lo trajo. */
  const releer = useCallback(async (): Promise<string | null> => {
    const respuesta = await llamarArea(area, "/borrador");
    if (sesionPerdida(area, respuesta)) return null;
    if (!esOk(respuesta.datos)) return mensajeFallo(respuesta, ERROR_RELEER);
    setPedido(pedidoDeRespuesta(respuesta.datos));
    return null;
  }, [area]);

  /**
   * Guarda el borrador que devolvió IA. Si la respuesta salió bien pero no lo
   * trae (un motor que responda solo `{ ok: true }`), se relee en vez de dejar
   * la tarjeta desfasada: el cliente tiene que ver lo que acaba de agregar.
   */
  const aplicar = useCallback(
    async (respuesta: RespuestaKioscoNav, porDefecto: string): Promise<string | null> => {
      if (sesionPerdida(area, respuesta)) return null;
      if (!esOk(respuesta.datos)) return mensajeFallo(respuesta, porDefecto);
      const devuelto = pedidoDeRespuesta(respuesta.datos);
      if (devuelto) {
        setPedido(devuelto);
        return null;
      }
      return releer();
    },
    [area, releer]
  );

  const agregarPieza = useCallback(
    async (captura: CapturaPartida): Promise<string | null> => {
      setOcupado(true);
      setError(null);
      try {
        const respuesta = await llamarArea(area, "/borrador/partidas", { cuerpo: captura });
        return await aplicar(respuesta, ERROR_AGREGAR);
      } finally {
        setOcupado(false);
      }
    },
    [area, aplicar]
  );

  async function cambiarCantidad(idPartida: number, cantidad: number): Promise<string | null> {
    const respuesta = await llamarArea(area, `/borrador/partidas/${idPartida}`, {
      metodo: "PATCH",
      cuerpo: { cantidad },
    });
    return aplicar(respuesta, ERROR_CANTIDAD);
  }

  async function quitarPartida(idPartida: number): Promise<string | null> {
    const respuesta = await llamarArea(area, `/borrador/partidas/${idPartida}`, { metodo: "DELETE" });
    return aplicar(respuesta, ERROR_QUITAR);
  }

  async function vaciar(): Promise<string | null> {
    const respuesta = await llamarArea(area, "/borrador", { metodo: "DELETE" });
    if (sesionPerdida(area, respuesta)) return null;
    if (!esOk(respuesta.datos)) return mensajeFallo(respuesta, ERROR_VACIAR);
    setPedido(null);
    return null;
  }

  const recibirPedidoDeVico = useCallback((devuelto: Pedido | null) => {
    setPedido(devuelto);
  }, []);

  function continuar() {
    router.push(area.rutas.datos);
  }

  const propsPedido = {
    pedido,
    ocupado,
    sucursal,
    nombreCliente,
    onCantidad: cambiarCantidad,
    onQuitar: quitarPartida,
    onVaciar: vaciar,
    onContinuar: continuar,
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 pb-20 sm:gap-4 lg:pb-0">
      {error && (
        <p role="alert" className={CLASE_ERROR_KIOSCO}>
          {error}
        </p>
      )}

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-12 lg:items-stretch lg:gap-5">
        <section
          aria-label={modo === "vico" ? `Pregúntale a ${NEGOCIO.asistente}` : "Busca tu pieza"}
          className="flex min-h-0 flex-col gap-3 lg:col-span-8"
        >
          <div className="min-h-0 flex-1">
            {modo === "vico" ? (
              <ChatKiosco
                nombreCliente={nombreCliente}
                onPedido={recibirPedidoDeVico}
                onAgregar={agregarPieza}
              />
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
              conTecla={area.conTeclado}
              onClick={() => setModo("buscar")}
            />
          ) : (
            <TarjetaCambio
              icono={MessageCircleQuestion}
              titulo="¿No sabes cómo se llama la pieza?"
              detalle={`Descríbesela a ${NEGOCIO.asistente} como se te ocurra: “el foco de adelante de un Versa 2016”.`}
              accion={`Pregúntale a ${NEGOCIO.asistente}`}
              conTecla={area.conTeclado}
              onClick={() => setModo("vico")}
            />
          )}
        </section>

        <aside aria-label="Tu pedido" className="hidden min-h-0 lg:col-span-4 lg:block">
          <PedidoKiosco {...propsPedido} />
        </aside>
      </div>

      <BarraPedidoMovil
        pedido={pedido}
        bloqueado={ocupado}
        onVer={() => setHojaAbierta(true)}
        onContinuar={continuar}
      />

      {hojaAbierta && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tu pedido"
          className="fixed inset-0 z-50 flex flex-col justify-end bg-plano-hondo/60 backdrop-blur-sm lg:hidden"
        >
          {/* Tocar fuera de la hoja la cierra; el botón de la esquina también. */}
          <button
            type="button"
            aria-label="Cerrar tu pedido"
            onClick={() => setHojaAbierta(false)}
            className="min-h-12 flex-1"
          />
          <div className="h-[85dvh] px-2 pb-2">
            <PedidoKiosco {...propsPedido} onCerrar={() => setHojaAbierta(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
