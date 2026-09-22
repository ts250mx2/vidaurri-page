"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { RotateCcw, Send, TriangleAlert, X } from "lucide-react";
import { twMerge } from "tailwind-merge";
import clsx from "clsx";
import { AvatarChat } from "@/components/chat/AvatarChat";
import { TextoVico, type FotoChat } from "@/components/chat/TextoVico";
import { NEGOCIO } from "@/config/negocio";
import {
  arregloDe,
  esOk,
  llamarArea,
  mensajeFallo,
  sesionPerdida,
} from "@/lib/kiosco/navegador";
import { sanearPedido, type PedidoKiosco, type PiezaDeVico } from "@/lib/kiosco/tipos";
import { useArea } from "./AreaContext";
import { CLASE_BOTON_NEUTRO_KIOSCO, CLASE_CAMPO_KIOSCO } from "./estilos";
import { PiezasDeVico, type AgregarPieza } from "./PiezasDeVico";

// Vico atendiendo al cliente que arma su pedido: parado en el kiosco de la
// tienda o desde su celular en el área de clientes (el área la dice el
// contexto; solo cambia a qué proxy se habla). Flota abajo a la derecha de la
// pantalla de armar el pedido (`ArmarPedido`), como en el sitio y en el
// mostrador; este componente solo pinta el chat en el alto que le den y
// ofrece la X cuando el padre manda `onCerrar`. Es el mismo asistente del chat
// público y del mostrador, pero con un actor que busca, cotiza y agrega al
// pedido, y NO puede enviarlo —eso es el botón ámbar de la pantalla— ni pedir
// datos personales.
//
// Diferencias con `ChatMostrador`, que es su gemelo: aquí no hay cliente del
// padrón que elegir, el texto de Vico no navega a ninguna parte y la
// conversación vive SOLO en memoria con una sesión de chat propia: en el
// kiosco el siguiente cliente empieza de cero; en el área de clientes no se
// mezcla con la memoria de WhatsApp.

const MAX_MENSAJE = 500;
/** Un poco por encima de los 115 s del proxy, que ya responde con error legible. */
const TIEMPO_MAXIMO_MS = 120_000;

const TEXTO_SATURADO = "Espera unos segundos y pregúntame otra vez";
const TEXTO_SIN_RESPUESTA = "No pude contestarte; pregúntame otra vez o dile al mostrador";

interface Mensaje {
  rol: "vico" | "cliente";
  texto: string;
  fotos?: FotoChat[];
  piezas?: PiezaDeVico[];
  /** Rótulo de la falla (tinta de anotación). Ausente = mensaje normal. */
  falla?: string;
}

const TEXTO_SALUDO =
  "Dime qué pieza buscas y de qué carro es, aunque no sepas cómo se llama. Por ejemplo: *el foco de adelante de un Versa 2016*.";

/** Con cliente del padrón, Vico saluda por su nombre: el pedido ya es suyo. */
function saludoPara(nombreCliente: string | null): Mensaje {
  return {
    rol: "vico",
    texto: nombreCliente ? `Hola, *${nombreCliente}*. ${TEXTO_SALUDO}` : TEXTO_SALUDO,
  };
}

function idAleatorio(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

/** Piezas del turno, ya recortadas por el proxy (precio con IVA y sí/no de existencia). */
function piezasDe(datos: Record<string, unknown> | null): PiezaDeVico[] {
  return arregloDe<PiezaDeVico>(datos, "productos");
}

function fotosDe(datos: Record<string, unknown> | null): FotoChat[] {
  return arregloDe<FotoChat>(datos, "fotos");
}

export function ChatKiosco({
  nombreCliente = null,
  onPedido,
  onAgregar,
  onCerrar,
  abierto = true,
}: {
  /** Nombre del cliente del padrón que entró; null = público general. */
  nombreCliente?: string | null;
  /** Borrador tal como quedó tras el turno (Vico sí puede agregar piezas). */
  onPedido: (pedido: PedidoKiosco | null) => void;
  onAgregar: AgregarPieza;
  /** Cerrar el panel flotante; sin él no se pinta la X. */
  onCerrar?: () => void;
  /** El padre lo acaba de abrir: el cursor va al campo (solo donde hay teclado). */
  abierto?: boolean;
}) {
  const area = useArea();
  const [mensajes, setMensajes] = useState<Mensaje[]>([saludoPara(nombreCliente)]);
  const [entrada, setEntrada] = useState("");
  const [enviando, setEnviando] = useState(false);
  const sesionRef = useRef<string | null>(null);
  const reiniciarRef = useRef(false);
  const enviandoRef = useRef(false);
  const finRef = useRef<HTMLDivElement>(null);
  const entradaRef = useRef<HTMLInputElement>(null);

  // En la PC del kiosco el chat se abre con el cursor listo: el cliente ya
  // venía tecleando. En el celular no: enfocar abriría el teclado y taparía
  // el saludo antes de leerlo. Se repite cada vez que el panel se abre.
  useEffect(() => {
    if (area.conTeclado && abierto) entradaRef.current?.focus();
  }, [area.conTeclado, abierto]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: "end" });
  }, [mensajes, enviando]);

  const enviar = useCallback(
    async (texto: string) => {
      const mensaje = texto.trim().slice(0, MAX_MENSAJE);
      if (!mensaje || enviandoRef.current) return;
      enviandoRef.current = true;
      setEnviando(true);
      setEntrada("");
      setMensajes((m) => [...m, { rol: "cliente", texto: mensaje }]);
      sesionRef.current ??= idAleatorio();

      const respuesta = await llamarArea(area, "/vico", {
        cuerpo: { sesion: sesionRef.current, mensaje, reiniciar: reiniciarRef.current },
        signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
      });
      reiniciarRef.current = false;
      enviandoRef.current = false;
      setEnviando(false);
      if (sesionPerdida(area, respuesta)) return;

      const { status, datos } = respuesta;
      const textoVico = typeof datos?.respuesta === "string" ? datos.respuesta : "";
      if (esOk(datos) && textoVico) {
        setMensajes((m) => [
          ...m,
          { rol: "vico", texto: textoVico, fotos: fotosDe(datos), piezas: piezasDe(datos) },
        ]);
        // `pedido` solo viene cuando Vico tocó el borrador; si no lo mandó, la
        // tarjeta del pedido se queda como está (no se vacía por omisión).
        if (datos !== null && "pedido" in datos) onPedido(sanearPedido(datos.pedido));
        return;
      }

      const saturado = status === 429;
      console.error(`[${area.area}] Vico no respondió`, status, mensajeFallo(respuesta, TEXTO_SIN_RESPUESTA));
      setMensajes((m) => [
        ...m,
        {
          rol: "vico",
          falla: saturado ? "Muchas preguntas seguidas" : "No pude contestar",
          texto: saturado ? TEXTO_SATURADO : mensajeFallo(respuesta, TEXTO_SIN_RESPUESTA),
        },
      ]);
    },
    [area, onPedido]
  );

  function reiniciar() {
    reiniciarRef.current = true;
    sesionRef.current = null;
    setMensajes([saludoPara(nombreCliente)]);
    setEntrada("");
    entradaRef.current?.focus();
  }

  /**
   * Escape solo limpia lo tecleado. Vico es la pantalla por default: salir de
   * aquí es ir al buscador, y eso lo hace la tarjeta de abajo o F2, no una
   * tecla que el cliente aprieta por reflejo.
   */
  function alTeclear(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key !== "Escape") return;
    evento.preventDefault();
    setEntrada("");
  }

  return (
    <div className="lamina flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-linea bg-hoja px-4 py-3 sm:px-5">
        <AvatarChat lado={40} className="ring-2 ring-ambar" />
        <div className="min-w-0">
          <p className="rotulo-tecnico truncate text-base text-tinta">
            Pregúntale a {NEGOCIO.asistente}
          </p>
          <p className="truncate text-sm text-tinta-suave">
            Descríbele la pieza con tus palabras.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Solo el reinicio: la salida al buscador es la tarjeta de abajo,
              que se ve más y no compite con el encabezado. */}
          <button
            type="button"
            onClick={reiniciar}
            disabled={enviando}
            aria-label="Empezar una conversación nueva"
            title="Empezar una conversación nueva"
            className={twMerge(CLASE_BOTON_NEUTRO_KIOSCO, "size-11 px-0 sm:size-11 sm:px-0")}
          >
            <RotateCcw aria-hidden className="size-4" />
          </button>
          {onCerrar && (
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar el chat y seguir buscando"
              title="Cerrar (la conversación se conserva)"
              className={twMerge(CLASE_BOTON_NEUTRO_KIOSCO, "size-11 px-0 sm:size-11 sm:px-0")}
            >
              <X aria-hidden className="size-5" />
            </button>
          )}
        </div>
      </div>

      <div aria-live="polite" className="flex-1 space-y-3 overflow-y-auto bg-papel px-3 py-4 sm:px-5">
        {mensajes.map((m, i) => {
          const esVico = m.rol === "vico";
          return (
            <div
              key={i}
              className={clsx(
                "max-w-[92%] px-4 py-3 text-base leading-relaxed",
                esVico && !m.falla && "lamina",
                esVico && m.falla && "rounded-lg border-2 border-anotacion bg-hoja text-tinta",
                !esVico && "ml-auto rounded-lg bg-plano text-white"
              )}
            >
              {m.falla && (
                <p className="rotulo-tecnico mb-1 flex items-center gap-1.5 text-xs text-anotacion">
                  <TriangleAlert aria-hidden className="size-4" />
                  {m.falla}
                </p>
              )}
              {/* Aquí no hay a dónde ir: los nombres de pieza que Vico enlaza
                  se quedan quietos y la pieza se agrega con su botón. */}
              <TextoVico texto={m.texto} fotos={m.fotos} alNavegar={() => undefined} />
              {m.piezas && m.piezas.length > 0 && (
                <PiezasDeVico piezas={m.piezas} ocupado={enviando} onAgregar={onAgregar} />
              )}
            </div>
          );
        })}
        {enviando && (
          <div className="lamina max-w-[92%] px-4 py-3 text-base text-tinta-suave">
            {NEGOCIO.asistente} está buscando en el catálogo…
          </div>
        )}
        <div ref={finRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void enviar(entrada);
        }}
        className="border-t border-linea bg-hoja px-3 py-3 sm:px-4"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <input
            ref={entradaRef}
            type="text"
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            onKeyDown={alTeclear}
            placeholder="Ej: la calavera derecha de un Aveo 2018"
            aria-label={`Escribe tu pregunta para ${NEGOCIO.asistente}`}
            maxLength={MAX_MENSAJE}
            autoComplete="off"
            className={CLASE_CAMPO_KIOSCO}
          />
          <button
            type="submit"
            disabled={enviando || !entrada.trim()}
            aria-label="Preguntar"
            className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-plano text-white transition-colors duration-150 hover:bg-plano-claro disabled:cursor-not-allowed disabled:opacity-45 sm:size-16"
          >
            <Send aria-hidden className="size-6" />
          </button>
        </div>
        <p className="mt-2 text-xs text-tinta-suave">
          Los precios que te diga llevan IVA incluido. {NEGOCIO.asistente} no manda tu pedido: eso lo
          haces tú con el botón <span className="font-semibold text-tinta">Continuar</span>.
        </p>
      </form>
    </div>
  );
}
