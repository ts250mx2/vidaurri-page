"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquareText, Phone, RotateCcw, Send, X } from "lucide-react";
import clsx from "clsx";
import { LogoAV } from "@/components/LogoAV";
import { IconWhatsApp } from "@/components/IconWhatsApp";
import { EVENTO_ABRIR_CHAT } from "@/components/BotonCotizar";
import { NEGOCIO, urlWhatsApp, PRELLENADOS } from "@/config/negocio";

// Chat "Vico": el Vendedor IA de Vidaurri en la web. Habla con el MISMO
// webservice que atiende WhatsApp (via /api/chat, la key nunca llega aqui).
// IA siempre visible y con salida humana permanente (telefono + WhatsApp).

interface Mensaje {
  rol: "vico" | "cliente";
  texto: string;
  fotos?: Array<{ codigo: string; url: string }>;
}

const CLAVE_SESION = "vico.sesion";
const CLAVE_HISTORIAL = "vico.historial";
const MS_PILL = 5000;

const SALUDO: Mensaje = {
  rol: "vico",
  texto: `¡Qué tal! Soy ${NEGOCIO.asistente}, del mostrador de Vidaurri. Dime marca, modelo, año y qué pieza necesitas, y te cotizo al momento con IVA incluido.`,
};

/** Render del formato estilo WhatsApp que devuelve el webservice:
 *  *negritas* con un solo asterisco y saltos de linea. */
function TextoWhatsApp({ texto }: { texto: string }) {
  return (
    <>
      {texto.split("\n").map((linea, i) => (
        <p key={i} className="min-h-[1em] whitespace-pre-wrap break-words">
          {linea.split(/\*([^*\n]+)\*/g).map((parte, j) =>
            j % 2 === 1 ? <strong key={j}>{parte}</strong> : parte
          )}
        </p>
      ))}
    </>
  );
}

export function ChatVico() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([SALUDO]);
  const [entrada, setEntrada] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pill, setPill] = useState(false);
  const reiniciarRef = useRef(false);
  const finRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const enviandoRef = useRef(false);

  // Restaura el hilo de la pestaña (sessionStorage) al montar.
  useEffect(() => {
    try {
      const crudo = sessionStorage.getItem(CLAVE_HISTORIAL);
      if (crudo) {
        const guardados = JSON.parse(crudo) as Mensaje[];
        if (Array.isArray(guardados) && guardados.length > 0) {
          setMensajes(guardados);
        }
      }
    } catch {
      // historial corrupto: se parte de cero
    }
    const t = setTimeout(() => setPill(true), 800);
    const t2 = setTimeout(() => setPill(false), 800 + MS_PILL);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(CLAVE_HISTORIAL, JSON.stringify(mensajes.slice(-40)));
    } catch {
      // sin storage disponible: el chat sigue funcionando en memoria
    }
    finRef.current?.scrollIntoView({ block: "end" });
  }, [mensajes]);

  const enviar = useCallback(async (texto: string) => {
    const mensaje = texto.trim();
    if (!mensaje || enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    setEntrada("");
    setMensajes((m) => [...m, { rol: "cliente", texto: mensaje }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sesion: localStorage.getItem(CLAVE_SESION) ?? undefined,
          mensaje,
          reiniciar: reiniciarRef.current,
        }),
      });
      reiniciarRef.current = false;
      const datos = (await res.json().catch(() => null)) as {
        ok?: boolean;
        sesion?: string;
        respuesta?: string;
        fotos?: Array<{ codigo: string; url: string }>;
        error?: string;
      } | null;

      if (datos?.sesion) localStorage.setItem(CLAVE_SESION, datos.sesion);

      if (datos?.ok && datos.respuesta) {
        setMensajes((m) => [
          ...m,
          { rol: "vico", texto: datos.respuesta!, fotos: datos.fotos ?? [] },
        ]);
      } else {
        setMensajes((m) => [
          ...m,
          {
            rol: "vico",
            texto:
              datos?.error === "Demasiados mensajes seguidos; espera un momento"
                ? "Me están llegando muchos mensajes seguidos 🙏 Espera un momentito y vuelve a intentar."
                : `Se me cayó el sistema un segundo 🙏 Inténtalo de nuevo, o escríbenos directo por WhatsApp al ${NEGOCIO.whatsappBonito}.`,
          },
        ]);
      }
    } catch {
      setMensajes((m) => [
        ...m,
        {
          rol: "vico",
          texto: `No pude conectar con el mostrador. Revisa tu señal e inténtalo de nuevo, o escríbenos por WhatsApp al ${NEGOCIO.whatsappBonito}.`,
        },
      ]);
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }, []);

  // Cualquier "Cotizar" del sitio abre el chat, con el mensaje ya preparado.
  useEffect(() => {
    function alAbrir(e: Event) {
      const detalle = (e as CustomEvent<{ mensaje?: string }>).detail;
      setAbierto(true);
      setPill(false);
      if (detalle?.mensaje) {
        if (detalle.mensaje.endsWith(": ")) {
          // Prellenado abierto (el cliente lo completa): va al input.
          setEntrada(detalle.mensaje);
          setTimeout(() => inputRef.current?.focus(), 50);
        } else {
          void enviar(detalle.mensaje);
        }
      } else {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
    window.addEventListener(EVENTO_ABRIR_CHAT, alAbrir);
    return () => window.removeEventListener(EVENTO_ABRIR_CHAT, alAbrir);
  }, [enviar]);

  function reiniciar() {
    reiniciarRef.current = true;
    setMensajes([SALUDO]);
  }

  return (
    <>
      {/* Lanzador flotante: solo desktop (en movil vive en la barra inferior). */}
      <div className="fixed bottom-6 right-6 z-40 hidden items-center gap-3 md:flex">
        {pill && !abierto && (
          <span className="rounded-full border border-borde bg-superficie px-3.5 py-2 text-sm font-semibold shadow-md">
            ¿Qué pieza buscas? Cotiza aquí
          </span>
        )}
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-label={abierto ? "Cerrar chat con Vico" : "Abrir chat con Vico"}
          className="flex size-14 items-center justify-center rounded-full bg-grafito text-white shadow-lg ring-2 ring-ambar transition-transform hover:scale-105"
        >
          <MessageSquareText aria-hidden className="size-6" />
        </button>
      </div>

      {abierto && (
        <div
          role="dialog"
          aria-label={`Chat con ${NEGOCIO.asistente}, asistente IA de Autopartes Vidaurri`}
          className={clsx(
            "fixed inset-0 z-50 flex flex-col bg-fondo",
            "md:inset-auto md:bottom-6 md:right-6 md:h-[620px] md:max-h-[calc(100vh-4rem)]",
            "md:w-[390px] md:overflow-hidden md:rounded-xl md:border md:border-borde md:shadow-2xl"
          )}
        >
          {/* Encabezado grafito: IA visible + salida humana permanente. */}
          <div className="border-b-4 border-ambar bg-grafito px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <LogoAV lado={34} />
              <div className="min-w-0">
                <p className="font-display text-sm font-semibold uppercase tracking-wide">
                  {NEGOCIO.asistente} · Autopartes Vidaurri
                </p>
                <p className="text-[11.5px] text-slate-300">
                  Asistente IA · cotiza 24/7 con IVA incluido
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={reiniciar}
                  aria-label="Empezar conversación nueva"
                  title="Empezar de nuevo"
                  className="rounded-md p-2 text-slate-300 hover:text-white"
                >
                  <RotateCcw className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  aria-label="Cerrar chat"
                  className="rounded-md p-2 text-slate-300 hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-3 text-[11.5px] text-slate-300">
              <span>¿Prefieres una persona?</span>
              <a href={`tel:${NEGOCIO.telefono}`} className="flex items-center gap-1 text-white underline-offset-2 hover:underline">
                <Phone aria-hidden className="size-3" /> Llamar
              </a>
              <a
                href={urlWhatsApp(PRELLENADOS.generico)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-white underline-offset-2 hover:underline"
              >
                <span className="text-whatsapp"><IconWhatsApp lado={12} /></span> WhatsApp
              </a>
            </div>
          </div>

          {/* Hilo */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {mensajes.map((m, i) => (
              <div
                key={i}
                className={clsx(
                  "max-w-[88%] rounded-xl px-3.5 py-2.5 text-[14px] leading-relaxed",
                  m.rol === "vico"
                    ? "border border-borde bg-superficie"
                    : "ml-auto bg-grafito text-white"
                )}
              >
                <TextoWhatsApp texto={m.texto} />
                {m.fotos && m.fotos.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {m.fotos.map((f) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        key={f.codigo}
                        src={f.url}
                        alt={`Foto de la pieza ${f.codigo}`}
                        loading="lazy"
                        className="aspect-square w-full rounded-md border border-borde bg-white object-contain"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {enviando && (
              <div className="max-w-[88%] rounded-xl border border-borde bg-superficie px-3.5 py-2.5 text-[13px] text-tinta-suave">
                {NEGOCIO.asistente} está buscando en el catálogo…
              </div>
            )}
            <div ref={finRef} />
          </div>

          {/* Entrada */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void enviar(entrada);
            }}
            className="border-t border-borde bg-superficie px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
                placeholder="Ej: cofre Aveo 2012"
                aria-label="Escribe tu mensaje para Vico"
                maxLength={2000}
                className="h-11 flex-1 rounded-md border border-borde bg-fondo px-3 text-base"
              />
              <button
                type="submit"
                disabled={enviando || !entrada.trim()}
                aria-label="Enviar mensaje"
                className="flex size-11 items-center justify-center rounded-md bg-ambar text-grafito transition-colors hover:bg-ambar-press hover:text-white disabled:opacity-50"
              >
                <Send aria-hidden className="size-5" />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[11px] text-tinta-suave">
              ¿Mejor por WhatsApp?{" "}
              <a
                href={urlWhatsApp(PRELLENADOS.generico)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-tinta underline-offset-2 hover:underline"
              >
                {NEGOCIO.whatsappBonito}
              </a>{" "}
              · Respondemos en minutos en horario hábil
            </p>
          </form>
        </div>
      )}
    </>
  );
}
