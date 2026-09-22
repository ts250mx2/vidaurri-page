"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Phone,
  RotateCcw,
  Send,
  TriangleAlert,
  X,
} from "lucide-react";
import clsx from "clsx";
import { AvatarChat } from "@/components/chat/AvatarChat";
import { IconWhatsApp } from "@/components/IconWhatsApp";
import { EVENTO_ABRIR_CHAT } from "@/components/BotonCotizar";
import { TextoVico, destinoPieza } from "@/components/chat/TextoVico";
import { prepararFoto, type FotoLista } from "@/components/chat/foto-cliente";
import { NEGOCIO, urlWhatsApp, PRELLENADOS } from "@/config/negocio";

// Chat "Vico": el Vendedor IA de Vidaurri en la web. Habla con el MISMO
// webservice que atiende WhatsApp (via /api/chat, la key nunca llega aqui).
// IA siempre visible y con salida humana permanente (telefono + WhatsApp).
//
// Revestido del mundo: el encabezado es campo azul con su filo ámbar, el hilo
// se lee sobre papel, lo que dice Vico va en lámina blanca con borde de línea
// y lo que escribe el cliente en tinta de plano. Las fallas se anotan en rojo,
// como la corrección del ajustador. El lanzador flotante es azul con anillo
// ámbar: nunca verde, para que jamás se confunda con WhatsApp. Vive en la
// esquina inferior derecha y el lanzador es la cara de Vico: el agente en la
// esquina, el mismo que en /mostrador/nuevo.

interface Mensaje {
  rol: "vico" | "cliente";
  texto: string;
  fotos?: Array<{ codigo: string; url: string }>;
  /** Miniatura de la foto que mandó el cliente (la completa no se guarda). */
  adjunta?: string;
  /** Rótulo de la falla (tinta de anotación). Ausente = mensaje normal. */
  falla?: string;
}

const CLAVE_SESION = "vico.sesion";
const CLAVE_HISTORIAL = "vico.historial";
const MS_PILL = 5000;

const SALUDO: Mensaje = {
  rol: "vico",
  texto: `¡Qué tal! Soy ${NEGOCIO.asistente}, del mostrador de Vidaurri. Dime marca, modelo, año y qué pieza necesitas, y te cotizo al momento con IVA incluido.`,
};

export function ChatVico() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([SALUDO]);
  const [entrada, setEntrada] = useState("");
  const [enviando, setEnviando] = useState(false);
  /** Foto adjunta que saldrá con el siguiente mensaje, y el aviso si no se pudo abrir. */
  const [foto, setFoto] = useState<FotoLista | null>(null);
  const [avisoFoto, setAvisoFoto] = useState<string | null>(null);
  const archivoRef = useRef<HTMLInputElement>(null);
  const [pill, setPill] = useState(false);
  /** Foto ampliada: las fotos del mensaje donde se dio clic y cuál se ve.
   *  La navegación se queda DENTRO del mensaje a propósito: cada respuesta de
   *  Vico cotiza piezas concretas y mezclar fotos de otras preguntas confunde. */
  const [ampliada, setAmpliada] = useState<{
    fotos: Array<{ codigo: string; url: string }>;
    idx: number;
  } | null>(null);
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
    // La invitación solo se ofrece en la portada. En una ficha o en el catálogo
    // el cliente ya tiene los botones de cotizar delante, y ahí el globo tapaba
    // contenido real — en la ficha se comía la leyenda del QR.
    if (window.location.pathname !== "/") return;
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

  const enviar = useCallback(async (texto: string, adjunta: FotoLista | null = null) => {
    const mensaje = texto.trim();
    if ((!mensaje && !adjunta) || enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    setEntrada("");
    setFoto(null);
    setAvisoFoto(null);
    setMensajes((m) => [...m, { rol: "cliente", texto: mensaje, adjunta: adjunta?.miniatura }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sesion: localStorage.getItem(CLAVE_SESION) ?? undefined,
          mensaje,
          imagen: adjunta?.dataUrl,
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
        const saturado =
          datos?.error === "Demasiados mensajes seguidos; espera un momento";
        setMensajes((m) => [
          ...m,
          {
            rol: "vico",
            falla: saturado ? "Muchos mensajes seguidos" : "No pude responder",
            texto: saturado
              ? "Me están llegando muchos mensajes seguidos. Espera un momentito y vuelve a intentar."
              : `Se me cayó el sistema un segundo. Inténtalo de nuevo, o escríbenos directo por WhatsApp al ${NEGOCIO.whatsappBonito}.`,
          },
        ]);
      }
    } catch {
      setMensajes((m) => [
        ...m,
        {
          rol: "vico",
          falla: "Sin conexión",
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

  // Teclado del visor: Esc cierra, flechas cambian de foto.
  useEffect(() => {
    if (!ampliada) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAmpliada(null);
        return;
      }
      if (ampliada.fotos.length < 2) return;
      if (e.key === "ArrowRight") {
        setAmpliada((a) => a && { ...a, idx: (a.idx + 1) % a.fotos.length });
      } else if (e.key === "ArrowLeft") {
        setAmpliada(
          (a) => a && { ...a, idx: (a.idx - 1 + a.fotos.length) % a.fotos.length }
        );
      }
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [ampliada]);

  function alElegirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir la misma foto
    if (archivo) void cargarFoto(archivo);
  }

  /** Ctrl+V con una imagen en el portapapeles (una captura, una foto copiada
   *  de WhatsApp Web) la adjunta igual que el botón. Si lo pegado es texto no
   *  se toca nada: sigue su camino normal al input. */
  function alPegar(e: React.ClipboardEvent) {
    const archivo = Array.from(e.clipboardData.files).find((f) => f.type.startsWith("image/"));
    if (!archivo || enviando) return;
    e.preventDefault();
    void cargarFoto(archivo);
  }

  async function cargarFoto(archivo: File) {
    try {
      setFoto(await prepararFoto(archivo));
      setAvisoFoto(null);
      inputRef.current?.focus();
    } catch {
      setFoto(null);
      setAvisoFoto("No pude abrir esa foto. Prueba con otra o tómala de nuevo.");
    }
  }

  function reiniciar() {
    reiniciarRef.current = true;
    setFoto(null);
    setAvisoFoto(null);
    setMensajes([SALUDO]);
    setAmpliada(null);
  }

  /** Salta a la ficha de la pieza cerrando chat y visor: en móvil el chat es
   *  pantalla completa y taparía la ficha. El hilo queda en sessionStorage,
   *  así que al reabrir el chat la conversación sigue donde estaba. */
  function irAPieza(href: string) {
    setAmpliada(null);
    setAbierto(false);
    router.push(href);
  }

  return (
    <>
      {/* Lanzador flotante: solo desktop (en movil vive en la barra inferior). */}
      <div className="fixed bottom-6 right-6 z-40 hidden flex-row-reverse items-center gap-3 md:flex">
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-label={abierto ? "Cerrar chat con Vico" : "Abrir chat con Vico"}
          className="flex size-14 items-center justify-center rounded-full bg-plano shadow-flotante ring-2 ring-ambar transition-transform duration-150 hover:scale-105 active:scale-100"
        >
          {abierto ? (
            <X aria-hidden className="size-6 text-white" />
          ) : (
            <AvatarChat lado={56} />
          )}
        </button>
        {pill && !abierto && (
          <span className="rounded-md border border-linea bg-hoja px-3.5 py-2 text-sm font-semibold text-tinta shadow-lamina-alta">
            ¿Qué pieza buscas? Cotiza aquí
          </span>
        )}
      </div>

      {abierto && (
        <div
          role="dialog"
          aria-label={`Chat con ${NEGOCIO.asistente}, asistente IA de Autopartes Vidaurri`}
          className={clsx(
            "fixed inset-0 z-50 flex flex-col bg-papel",
            "md:inset-auto md:bottom-24 md:right-6 md:h-[620px] md:max-h-[calc(100vh-8rem)]",
            "md:w-[390px] md:overflow-hidden md:rounded-lg md:border md:border-linea-fuerte md:shadow-flotante"
          )}
        >
          {/* Encabezado en campo azul: IA visible + salida humana permanente. */}
          <div className="sobre-plano border-b-4 border-ambar bg-plano px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <AvatarChat lado={40} className="ring-2 ring-ambar" />
              <div className="min-w-0">
                <p className="rotulo-tecnico truncate text-sm">
                  {NEGOCIO.asistente} · Autopartes Vidaurri
                </p>
                <p className="truncate text-[11.5px] text-white/70">
                  Asistente IA · cotiza 24/7 con IVA incluido
                </p>
              </div>
              <div className="-mr-2 ml-auto flex items-center">
                <button
                  type="button"
                  onClick={reiniciar}
                  aria-label="Empezar conversación nueva"
                  title="Empezar de nuevo"
                  className="flex size-11 items-center justify-center rounded-md text-white/75 transition-colors duration-150 hover:bg-plano-claro hover:text-white"
                >
                  <RotateCcw aria-hidden className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  aria-label="Cerrar chat"
                  className="flex size-11 items-center justify-center rounded-md text-white/75 transition-colors duration-150 hover:bg-plano-claro hover:text-white"
                >
                  <X aria-hidden className="size-5" />
                </button>
              </div>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 text-[11.5px] text-white/70">
              <span>¿Prefieres una persona?</span>
              <a
                href={`tel:${NEGOCIO.telefono}`}
                className="inline-flex min-h-9 items-center gap-1 text-white underline-offset-2 hover:underline"
              >
                <Phone aria-hidden className="size-3" /> Llamar
              </a>
              <a
                href={urlWhatsApp(PRELLENADOS.generico)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center gap-1 text-white underline-offset-2 hover:underline"
              >
                <span className="text-whatsapp">
                  <IconWhatsApp lado={12} />
                </span>{" "}
                WhatsApp
              </a>
            </div>
          </div>

          {/* Hilo */}
          <div
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {mensajes.map((m, i) => {
              const esVico = m.rol === "vico";
              return (
                <div
                  key={i}
                  className={clsx(
                    "max-w-[88%] px-3.5 py-2.5 text-[14px] leading-relaxed",
                    esVico && !m.falla && "lamina",
                    esVico &&
                      m.falla &&
                      "rounded-md border border-anotacion bg-hoja text-tinta",
                    !esVico && "ml-auto rounded-md bg-plano text-white"
                  )}
                >
                  {m.falla && (
                    <p className="rotulo-tecnico mb-1 flex items-center gap-1.5 text-[11px] text-anotacion">
                      <TriangleAlert aria-hidden className="size-3.5" />
                      {m.falla}
                    </p>
                  )}
                  {m.adjunta && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.adjunta}
                      alt="Foto que enviaste"
                      className={clsx("max-h-40 rounded-sm border border-white/30", m.texto && "mb-1.5")}
                    />
                  )}
                  <TextoVico
                    texto={m.texto}
                    fotos={m.fotos}
                    alNavegar={irAPieza}
                  />
                  {m.fotos && m.fotos.length > 0 && (
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      {m.fotos.map((f, j) => (
                        <button
                          key={f.codigo}
                          type="button"
                          onClick={() => setAmpliada({ fotos: m.fotos!, idx: j })}
                          aria-label={`Ver en grande la foto de la pieza ${f.codigo}`}
                          className="cursor-zoom-in rounded-sm transition-transform duration-150 hover:scale-[1.04] focus-visible:outline-2 focus-visible:outline-ambar"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={f.url}
                            alt={`Foto de la pieza ${f.codigo}`}
                            loading="lazy"
                            className="mesa-dibujo aspect-square w-full rounded-sm border border-linea object-contain"
                          />
                        </button>
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

          {/* Entrada */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void enviar(entrada, foto);
            }}
            onPaste={alPegar}
            className="border-t border-linea bg-hoja px-3 py-2.5"
          >
            {foto && (
              <div className="mb-2 flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto.miniatura}
                  alt="Foto lista para enviar"
                  className="size-14 rounded-sm border border-linea object-cover"
                />
                <span className="text-[12px] text-tinta-suave">Foto lista. Escribe para qué carro es, o envíala así.</span>
                <button
                  type="button"
                  onClick={() => setFoto(null)}
                  aria-label="Quitar la foto"
                  className="ml-auto flex size-9 items-center justify-center rounded-md text-tinta-suave transition-colors duration-150 hover:bg-papel hover:text-tinta"
                >
                  <X aria-hidden className="size-4" />
                </button>
              </div>
            )}
            {avisoFoto && (
              <p role="alert" className="mb-2 text-[12px] text-anotacion">
                {avisoFoto}
              </p>
            )}
            <div className="flex items-center gap-2">
              <input
                ref={archivoRef}
                type="file"
                accept="image/*"
                onChange={alElegirFoto}
                className="hidden"
                tabIndex={-1}
                aria-hidden
              />
              <button
                type="button"
                onClick={() => archivoRef.current?.click()}
                disabled={enviando}
                aria-label="Adjuntar una foto de la pieza"
                title="Mandar una foto de la pieza (también puedes pegarla con Ctrl+V)"
                className="flex size-11 shrink-0 items-center justify-center rounded-md border border-linea bg-papel text-tinta transition-colors duration-150 hover:border-linea-fuerte disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ImagePlus aria-hidden className="size-5" />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
                placeholder={foto ? "¿Para qué carro es?" : "Ej: cofre Aveo 2012"}
                aria-label="Escribe tu mensaje para Vico"
                maxLength={2000}
                className="h-11 flex-1 rounded-md border border-linea bg-papel px-3 text-base text-tinta placeholder:text-tinta-suave"
              />
              <button
                type="submit"
                disabled={enviando || (!entrada.trim() && !foto)}
                aria-label="Enviar mensaje"
                className="flex size-11 shrink-0 items-center justify-center rounded-md bg-ambar text-plano-hondo transition-colors duration-150 hover:bg-ambar-press disabled:cursor-not-allowed disabled:opacity-45"
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
                className="num-tab font-mono font-semibold text-tinta underline-offset-2 hover:underline"
              >
                {NEGOCIO.whatsappBonito}
              </a>{" "}
              · Ahí te contesta {NEGOCIO.asistente} mismo, 24/7
            </p>
          </form>
        </div>
      )}

      {/* Visor: la foto de la pieza en grande, encima del chat. Clic fuera,
          la X o Esc regresan al hilo tal como estaba. */}
      {ampliada && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ampliada de la pieza ${ampliada.fotos[ampliada.idx].codigo}`}
          onClick={() => setAmpliada(null)}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-black/85 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={() => setAmpliada(null)}
            aria-label="Cerrar la foto"
            className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-md text-white/80 transition-colors duration-150 hover:bg-white/10 hover:text-white"
          >
            <X aria-hidden className="size-6" />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ampliada.fotos[ampliada.idx].url}
            alt={`Foto de la pieza ${ampliada.fotos[ampliada.idx].codigo}, ampliada`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[74vh] max-w-[94vw] rounded-md bg-white object-contain shadow-flotante"
          />

          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2"
          >
            {ampliada.fotos.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setAmpliada(
                    (a) =>
                      a && { ...a, idx: (a.idx - 1 + a.fotos.length) % a.fotos.length }
                  )
                }
                aria-label="Foto anterior"
                className="flex size-11 items-center justify-center rounded-md border border-white/25 text-white transition-colors duration-150 hover:bg-white/10"
              >
                <ChevronLeft aria-hidden className="size-5" />
              </button>
            )}
            {/* La placa del código es la puerta a la ficha: ahí vive el precio,
                la compatibilidad y el botón de cotizar. Cierra chat y visor al
                navegar — en móvil el chat taparía la ficha. */}
            <Link
              href={destinoPieza(ampliada.fotos[ampliada.idx].codigo, ampliada.fotos)}
              onClick={(e) => {
                e.preventDefault();
                irAPieza(destinoPieza(ampliada.fotos[ampliada.idx].codigo, ampliada.fotos));
              }}
              className="num-tab flex items-center gap-2 rounded-md border border-ambar bg-ambar/10 px-3.5 py-2 font-mono text-[13px] font-semibold text-white transition-colors duration-150 hover:bg-ambar hover:text-plano-hondo"
            >
              {ampliada.fotos[ampliada.idx].codigo}
              <span className="font-sans font-bold">· Ver la pieza →</span>
              {ampliada.fotos.length > 1 && (
                <span className="opacity-60">
                  {ampliada.idx + 1} / {ampliada.fotos.length}
                </span>
              )}
            </Link>
            {ampliada.fotos.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setAmpliada((a) => a && { ...a, idx: (a.idx + 1) % a.fotos.length })
                }
                aria-label="Foto siguiente"
                className="flex size-11 items-center justify-center rounded-md border border-white/25 text-white transition-colors duration-150 hover:bg-white/10"
              >
                <ChevronRight aria-hidden className="size-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
