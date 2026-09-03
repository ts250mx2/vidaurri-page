"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, Send, TriangleAlert } from "lucide-react";
import clsx from "clsx";
import { LogoAV } from "@/components/LogoAV";
import { TextoVico, type FotoChat } from "@/components/chat/TextoVico";
import { CLASE_BOTON_SECUNDARIO, CLASE_CAMPO } from "@/components/mostrador/estilos";
import { NEGOCIO } from "@/config/negocio";
import {
  arregloDe,
  esOk,
  llamarProxy,
  mensajeFallo,
  pedidoDe,
  sesionVencida,
} from "@/lib/mostrador/navegador";
import {
  SUCURSALES_ENTREGA,
  type PedidoDetalle,
  type SucursalEntrega,
} from "@/lib/mostrador/tipos";

// Vico en modo vendedor, INLINE en /mostrador/nuevo (no flota: aquí es la
// herramienta de trabajo, no una invitación). Habla con /api/mostrador/vico
// de PAGE, que reenvía a IA con la cookie del vendedor. El cliente que se
// atiende NO lo decide el modelo: PAGE manda `idCliente` en cada turno y el
// servidor cotiza con ese descuento. Cada respuesta trae el borrador tal
// como quedó y se sube al padre con `onPedido`, para que la tarjeta de la
// derecha se actualice sin que el vendedor recargue.

interface Mensaje {
  rol: "vico" | "vendedor";
  texto: string;
  fotos?: FotoChat[];
  /** Rótulo de la falla (tinta de anotación). Ausente = mensaje normal. */
  falla?: string;
}

export interface PropsChatMostrador {
  idCliente: number | null;
  sucursal: SucursalEntrega;
  /** Borrador tras el turno; null cuando Vico lo cerró (lo envió o lo canceló). */
  onPedido: (pedido: PedidoDetalle | null) => void;
}

/** Id de sesión de la pestaña. SIN el prefijo 77 del chat público: ese es un
 *  "teléfono" sintético para anónimos y aquí la memoria de IA va por usuario. */
const CLAVE_SESION = "mostrador.vico.sesion";
const MAX_MENSAJE = 2000;
/** Un poco por encima de los 115 s del proxy, que ya responde con error legible. */
const TIEMPO_MAXIMO_MS = 120_000;
const MAX_FOTOS = 6;

const SALUDO: Mensaje = {
  rol: "vico",
  texto:
    "Dime qué pieza busca el cliente y para qué carro; yo la busco, la agrego al pedido y lo confirmo cuando me digas.",
};
const TEXTO_SATURADO = "Espera un momento";
const TEXTO_SIN_RESPUESTA = "Vico no respondió; intenta de nuevo";

function idAleatorio(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "");
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

/** La sesión vive en sessionStorage: se conserva entre recargas de la pestaña
 *  y muere con ella. Sin storage (modo privado estricto) se crea una en memoria. */
function sesionDeLaPestana(): string {
  try {
    const guardada = sessionStorage.getItem(CLAVE_SESION);
    if (guardada) return guardada;
    const nueva = idAleatorio();
    sessionStorage.setItem(CLAVE_SESION, nueva);
    return nueva;
  } catch {
    return idAleatorio();
  }
}

function nombreSucursal(clave: SucursalEntrega): string {
  return SUCURSALES_ENTREGA.find((s) => s.clave === clave)?.nombre ?? clave;
}

/** Fotos como las manda IA (`[{ codigo, url }]`), acotadas y sin basura. */
function fotosDe(datos: Parameters<typeof arregloDe>[0]): FotoChat[] {
  return arregloDe<Partial<FotoChat>>(datos, "fotos")
    .filter((f): f is FotoChat => typeof f.codigo === "string" && typeof f.url === "string")
    .slice(0, MAX_FOTOS);
}

export function ChatMostrador({ idCliente, sucursal, onPedido }: PropsChatMostrador) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([SALUDO]);
  const [entrada, setEntrada] = useState("");
  const [enviando, setEnviando] = useState(false);
  const sesionRef = useRef<string | null>(null);
  const reiniciarRef = useRef(false);
  const enviandoRef = useRef(false);
  const finRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      setMensajes((m) => [...m, { rol: "vendedor", texto: mensaje }]);
      sesionRef.current ??= sesionDeLaPestana();

      const respuesta = await llamarProxy("/vico", {
        cuerpo: {
          sesion: sesionRef.current,
          mensaje,
          reiniciar: reiniciarRef.current,
          idCliente,
        },
        signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
      });
      reiniciarRef.current = false;
      enviandoRef.current = false;
      setEnviando(false);
      if (sesionVencida(respuesta.status)) return;

      const { status, datos } = respuesta;
      const textoVico = typeof datos?.respuesta === "string" ? datos.respuesta : "";
      if (esOk(datos) && textoVico) {
        setMensajes((m) => [...m, { rol: "vico", texto: textoVico, fotos: fotosDe(datos) }]);
        // `pedido` viene siempre (null si Vico lo envió o canceló): solo se
        // avisa cuando IA de veras lo mandó, no cuando la respuesta no lo trae.
        if (datos !== null && "pedido" in datos) onPedido(pedidoDe(datos));
        return;
      }

      const saturado = status === 429;
      console.error("[mostrador] Vico no respondió", status, mensajeFallo(respuesta, TEXTO_SIN_RESPUESTA));
      setMensajes((m) => [
        ...m,
        {
          rol: "vico",
          falla: saturado ? "Muchos mensajes seguidos" : "Sin respuesta",
          texto: saturado ? TEXTO_SATURADO : TEXTO_SIN_RESPUESTA,
        },
      ]);
    },
    [idCliente, onPedido]
  );

  function reiniciar() {
    reiniciarRef.current = true;
    setMensajes([SALUDO]);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  /** Los enlaces de Vico llevan a la ficha pública: se abre aparte para no
   *  perder la captura, que es la pantalla de trabajo. */
  function abrirFicha(href: string) {
    window.open(href, "_blank", "noopener");
  }

  return (
    <div className="lamina flex h-[70vh] flex-col overflow-hidden lg:h-[calc(100vh-13rem)] lg:min-h-[560px]">
      <div className="flex items-center gap-2.5 border-b border-linea bg-hoja px-4 py-3">
        <LogoAV lado={30} />
        <div className="min-w-0">
          <p className="rotulo-tecnico truncate text-sm text-tinta">{NEGOCIO.asistente}</p>
          <p className="truncate text-[11.5px] text-tinta-suave">
            Busca, cotiza y arma el pedido · recoge en {nombreSucursal(sucursal)}
          </p>
        </div>
        <button
          type="button"
          onClick={reiniciar}
          disabled={enviando}
          title="Empezar una conversación nueva"
          className={clsx(CLASE_BOTON_SECUNDARIO, "ml-auto gap-1.5")}
        >
          <RotateCcw aria-hidden className="size-3.5" />
          Nueva conversación
        </button>
      </div>

      <div aria-live="polite" className="flex-1 space-y-3 overflow-y-auto bg-papel px-4 py-4">
        {mensajes.map((m, i) => {
          const esVico = m.rol === "vico";
          return (
            <div
              key={i}
              className={clsx(
                "max-w-[88%] px-3.5 py-2.5 text-[14px] leading-relaxed",
                esVico && !m.falla && "lamina",
                esVico && m.falla && "rounded-md border border-anotacion bg-hoja text-tinta",
                !esVico && "ml-auto rounded-md bg-plano text-white"
              )}
            >
              {m.falla && (
                <p className="rotulo-tecnico mb-1 flex items-center gap-1.5 text-[11px] text-anotacion">
                  <TriangleAlert aria-hidden className="size-3.5" />
                  {m.falla}
                </p>
              )}
              <TextoVico texto={m.texto} fotos={m.fotos} alNavegar={abrirFicha} />
              {m.fotos && m.fotos.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {m.fotos.map((f) => (
                    <a
                      key={f.codigo}
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Ver en grande la foto de ${f.codigo}`}
                      className="rounded-sm transition-transform duration-150 hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-ambar"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f.url}
                        alt={`Foto de la pieza ${f.codigo}`}
                        loading="lazy"
                        className="mesa-dibujo aspect-square w-full rounded-sm border border-linea object-contain"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {enviando && (
          <div className="lamina max-w-[88%] px-3.5 py-2.5 text-[13px] text-tinta-suave">
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
        className="border-t border-linea bg-hoja px-3 py-2.5"
      >
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            placeholder="Ej: facia Versa 2016 para este cliente"
            aria-label={`Escribe tu mensaje para ${NEGOCIO.asistente}`}
            maxLength={MAX_MENSAJE}
            autoComplete="off"
            className={CLASE_CAMPO}
          />
          <button
            type="submit"
            disabled={enviando || !entrada.trim()}
            aria-label="Enviar mensaje"
            className="flex size-11 shrink-0 items-center justify-center rounded-md bg-plano text-white transition-colors duration-150 hover:bg-plano-claro disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Send aria-hidden className="size-5" />
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-tinta-suave">
          Los precios que cita van con IVA incluido y ya con el descuento del cliente elegido.
        </p>
      </form>
    </div>
  );
}
