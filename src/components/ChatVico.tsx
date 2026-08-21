"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  Phone,
  RotateCcw,
  Send,
  TriangleAlert,
  X,
} from "lucide-react";
import clsx from "clsx";
import { LogoAV } from "@/components/LogoAV";
import { IconWhatsApp } from "@/components/IconWhatsApp";
import { EVENTO_ABRIR_CHAT } from "@/components/BotonCotizar";
import { NEGOCIO, urlWhatsApp, PRELLENADOS } from "@/config/negocio";

// Chat "Vico": el Vendedor IA de Vidaurri en la web. Habla con el MISMO
// webservice que atiende WhatsApp (via /api/chat, la key nunca llega aqui).
// IA siempre visible y con salida humana permanente (telefono + WhatsApp).
//
// Revestido del mundo: el encabezado es campo azul con su filo ámbar, el hilo
// se lee sobre papel, lo que dice Vico va en lámina blanca con borde de línea
// y lo que escribe el cliente en tinta de plano. Las fallas se anotan en rojo,
// como la corrección del ajustador. El lanzador flotante es azul con anillo
// ámbar: nunca verde, para que jamás se confunda con WhatsApp.

interface Mensaje {
  rol: "vico" | "cliente";
  texto: string;
  fotos?: Array<{ codigo: string; url: string }>;
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

type FotoChat = { codigo: string; url: string };

/** ¿Lo que va entre paréntesis es un código de pieza? Con el prefijo "código"
 *  se acepta casi cualquier token; sin prefijo se exige letra Y dígito, para
 *  no convertir en enlace paréntesis normales como "(DER)" o "(18-23)". */
function comoCodigo(crudo: string): string | null {
  const limpio = crudo.trim();
  const sinPrefijo = limpio.replace(/^c[oó]d(?:igo)?\.?:?\s+/i, "");
  if (!/^[A-Za-z0-9._/-]{3,30}$/.test(sinPrefijo)) return null;
  const tuvoPrefijo = sinPrefijo !== limpio;
  if (!tuvoPrefijo && !(/[A-Za-z]/.test(sinPrefijo) && /\d/.test(sinPrefijo))) {
    return null;
  }
  return sinPrefijo;
}

/** A dónde manda un código: a la ficha de nuevas, salvo que la foto del mismo
 *  código venga de la Bodega Usado (las usadas no tienen ficha por código,
 *  se buscan). */
function destinoPieza(codigo: string, fotos?: FotoChat[]): string {
  const foto = fotos?.find(
    (f) => f.codigo.toUpperCase() === codigo.toUpperCase()
  );
  if (foto && /\/usadas\//i.test(foto.url)) {
    return `/usadas?texto=${encodeURIComponent(codigo)}`;
  }
  return `/pieza/${encodeURIComponent(codigo)}`;
}

/** ¿Esta negrita parece el NOMBRE de una pieza? Descarta precios y las
 *  palabras de entrega que el vendedor también pone en negritas. */
function esNombreDePieza(negrita: string): boolean {
  const limpio = negrita.trim();
  if (limpio.length < 4 || limpio.startsWith("$")) return false;
  if (!/[A-Za-zÁÉÍÓÚáéíóúñÑ]/.test(limpio)) return false;
  return !/^(entrega\s+inmediata|sobre\s+pedido|usadas?|nuevas?|pieza\s+única)$/i.test(
    limpio
  );
}

const RE_PAREN_TRAS_NEGRITA = /^(\s*)\(([^()\n]{3,40})\)/;

/** Render del formato estilo WhatsApp que devuelve el webservice: *negritas*
 *  con un solo asterisco y saltos de línea. Además ENLAZA cada producto a su
 *  página: si junto al nombre viene el código —"*Cofre Aveo 18-23* (CCAE18)"—
 *  ese es el enlace; si el texto no trae códigos, se usan los de las fotos del
 *  mensaje (son los códigos exactos de lo que Vico sugirió), emparejados en
 *  orden solo cuando la cuenta coincide, para no enlazar a la pieza equivocada. */
function TextoVico({
  texto,
  fotos,
  alNavegar,
}: {
  texto: string;
  fotos?: FotoChat[];
  alNavegar: (href: string) => void;
}) {
  // Pasada 1: cada línea partida en [texto, negrita, texto, ...], y por cada
  // negrita se busca el código en el paréntesis que la sigue.
  const lineas = texto.split("\n").map((linea) => {
    const partes = linea.split(/\*([^*\n]+)\*/g);
    const codigos: Array<string | null> = [];
    const recortes: number[] = [];
    for (let j = 1; j < partes.length; j += 2) {
      const m = RE_PAREN_TRAS_NEGRITA.exec(partes[j + 1] ?? "");
      const codigo = m ? comoCodigo(m[2]) : null;
      codigos.push(codigo);
      recortes.push(codigo && m ? m[0].length : 0);
    }
    return { partes, codigos, recortes };
  });

  // Respaldo: sin códigos en el texto pero con fotos, se emparejan nombres y
  // fotos en orden. Solo si la cuenta cuadra (o hay UNA foto y UN nombre):
  // adivinar de más enlazaría a la pieza equivocada.
  const hayEnlaceEnTexto = lineas.some((l) => l.codigos.some(Boolean));
  if (!hayEnlaceEnTexto && fotos && fotos.length > 0) {
    const nombres: Array<{ linea: number; slot: number }> = [];
    lineas.forEach((l, i) => {
      l.codigos.forEach((_, slot) => {
        if (esNombreDePieza(l.partes[slot * 2 + 1] ?? "")) {
          nombres.push({ linea: i, slot });
        }
      });
    });
    if (nombres.length === fotos.length || (fotos.length === 1 && nombres.length === 1)) {
      nombres.forEach(({ linea, slot }, k) => {
        lineas[linea].codigos[slot] = fotos[k].codigo;
      });
    }
  }

  return (
    <>
      {lineas.map(({ partes, codigos, recortes }, i) => (
        <p key={i} className="min-h-[1em] whitespace-pre-wrap break-words">
          {partes.map((parte, j) => {
            if (j % 2 === 1) {
              const slot = (j - 1) / 2;
              const codigo = codigos[slot];
              if (!codigo) return <strong key={j}>{parte}</strong>;
              const paren = recortes[slot]
                ? (partes[j + 1] ?? "").slice(0, recortes[slot])
                : "";
              const destino = destinoPieza(codigo, fotos);
              return (
                <Link
                  key={j}
                  href={destino}
                  // Navegación manual: cerrar el chat en el mismo clic desmonta
                  // el <a> a media propagación y Next pierde el brinco. Se
                  // previene el default y navega el router, que no depende del
                  // elemento.
                  onClick={(e) => {
                    e.preventDefault();
                    alNavegar(destino);
                  }}
                  title={`Ver la pieza ${codigo} en la página`}
                  className="font-bold underline decoration-ambar decoration-2 underline-offset-2 transition-colors duration-150 hover:text-ambar-press"
                >
                  {parte}
                  {paren}
                </Link>
              );
            }
            // Texto plano: si su arranque ya se pintó dentro del enlace de la
            // negrita anterior, se recorta para no duplicar el paréntesis.
            const slotPrevio = j / 2 - 1;
            const recorte = j >= 2 ? (recortes[slotPrevio] ?? 0) : 0;
            const visible =
              recorte && codigos[slotPrevio] ? parte.slice(recorte) : parte;
            return visible;
          })}
        </p>
      ))}
    </>
  );
}

export function ChatVico() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([SALUDO]);
  const [entrada, setEntrada] = useState("");
  const [enviando, setEnviando] = useState(false);
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

  function reiniciar() {
    reiniciarRef.current = true;
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
      <div className="fixed bottom-6 right-6 z-40 hidden items-center gap-3 md:flex">
        {pill && !abierto && (
          <span className="rounded-md border border-linea bg-hoja px-3.5 py-2 text-sm font-semibold text-tinta shadow-lamina-alta">
            ¿Qué pieza buscas? Cotiza aquí
          </span>
        )}
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          aria-label={abierto ? "Cerrar chat con Vico" : "Abrir chat con Vico"}
          className="flex size-14 items-center justify-center rounded-full bg-plano text-white shadow-flotante ring-2 ring-ambar transition-transform duration-150 hover:scale-105 active:scale-100"
        >
          <MessageSquareText aria-hidden className="size-6" />
        </button>
      </div>

      {abierto && (
        <div
          role="dialog"
          aria-label={`Chat con ${NEGOCIO.asistente}, asistente IA de Autopartes Vidaurri`}
          className={clsx(
            "fixed inset-0 z-50 flex flex-col bg-papel",
            "md:inset-auto md:bottom-6 md:right-6 md:h-[620px] md:max-h-[calc(100vh-4rem)]",
            "md:w-[390px] md:overflow-hidden md:rounded-lg md:border md:border-linea-fuerte md:shadow-flotante"
          )}
        >
          {/* Encabezado en campo azul: IA visible + salida humana permanente. */}
          <div className="sobre-plano border-b-4 border-ambar bg-plano px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <LogoAV lado={34} />
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
                placeholder="Ej: cofre Aveo 2012"
                aria-label="Escribe tu mensaje para Vico"
                maxLength={2000}
                className="h-11 flex-1 rounded-md border border-linea bg-papel px-3 text-base text-tinta placeholder:text-tinta-suave"
              />
              <button
                type="submit"
                disabled={enviando || !entrada.trim()}
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
