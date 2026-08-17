"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import clsx from "clsx";

// LA VITRINA — el contenedor que comparte el carrusel entre el hero y la tira
// de credenciales, para que la MISMA foto corra por detrás de las dos.
//
// El carrusel DESLIZA de izquierda a derecha: las seis tomas van en una tira
// horizontal que se mueve con `translateX`. Al final de la vuelta hay un clon de
// la primera, así que la tira siempre avanza en la misma dirección y el regreso
// al inicio ocurre sin transición, cuando el clon ya está en pantalla y es
// idéntico al destino: no se ve el rebobinado de seis pantallas.
//
// El estado vive aquí, no en el fondo, porque los indicadores se dibujan en la
// esquina del hero (donde hay foto libre) y no al pie del bloque completo: ahí
// caían encima de la última credencial y la tapaban.

const TOTAL = 6;
const MS_POR_TOMA = 6500;
const MS_DESLIZA = 900;

interface EstadoVitrina {
  /** Posición en la tira: 0..TOTAL (TOTAL es el clon de la primera). */
  posicion: number;
  /** La toma que el visitante está viendo, ya normalizada a 0..TOTAL-1. */
  activa: number;
  total: number;
  /** true = el visitante pidió menos movimiento: el cambio va sin deslizar. */
  sinMovimiento: boolean;
  /** false solo en el fotograma del regreso al inicio, para que no se vea. */
  anima: boolean;
  elegir: (i: number) => void;
}

const Contexto = createContext<EstadoVitrina | null>(null);

export function Vitrina({ children }: { children: React.ReactNode }) {
  const [posicion, setPosicion] = useState(0);
  const [anima, setAnima] = useState(true);
  const [sinMovimiento, setSinMovimiento] = useState(false);

  useEffect(() => {
    // `prefers-reduced-motion` cambia el CÓMO, no el SI: el carrusel es
    // contenido (las fotos de la bodega) y detenerlo dejaba a mucha gente
    // viendo una sola foto sin saber que había seis. Un deslizamiento sí puede
    // molestar, así que con la preferencia activa la toma cambia en seco.
    const consulta = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!consulta) return;
    setSinMovimiento(consulta.matches);
    const alCambiar = (e: MediaQueryListEvent) => setSinMovimiento(e.matches);
    consulta.addEventListener?.("change", alCambiar);
    return () => consulta.removeEventListener?.("change", alCambiar);
  }, []);

  // Avanza siempre hacia la derecha. `posicion` en las dependencias: elegir una
  // toma a mano reinicia el reloj, así la elegida se ve completa.
  useEffect(() => {
    const reloj = setInterval(() => setPosicion((p) => p + 1), MS_POR_TOMA);
    return () => clearInterval(reloj);
  }, [posicion]);

  // El regreso: cuando la tira llegó al clon, se salta al original sin
  // transición. Como el clon y el original son la misma foto, el corte es
  // invisible y la siguiente vuelta arranca deslizando igual que la primera.
  useEffect(() => {
    if (posicion !== TOTAL) return;
    const espera = setTimeout(
      () => {
        setAnima(false);
        setPosicion(0);
      },
      sinMovimiento ? 0 : MS_DESLIZA + 60
    );
    return () => clearTimeout(espera);
  }, [posicion, sinMovimiento]);

  // Devuelve la transición en el fotograma siguiente al salto, nunca en el
  // mismo: reactivarla de inmediato haría que el salto se animara.
  useEffect(() => {
    if (anima) return;
    const cuadro = requestAnimationFrame(() =>
      requestAnimationFrame(() => setAnima(true))
    );
    return () => cancelAnimationFrame(cuadro);
  }, [anima]);

  const elegir = useCallback((i: number) => {
    setAnima(true);
    setPosicion(i);
  }, []);

  const valor = useMemo(
    () => ({
      posicion,
      activa: posicion % TOTAL,
      total: TOTAL,
      sinMovimiento,
      anima,
      elegir,
    }),
    [posicion, sinMovimiento, anima, elegir]
  );

  return (
    <Contexto.Provider value={valor}>
      <div className="relative isolate overflow-hidden bg-plano-hondo">
        <FotosVitrina />
        {children}
      </div>
    </Contexto.Provider>
  );
}

function useVitrina(): EstadoVitrina {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error("Falta <Vitrina> alrededor de este componente.");
  return ctx;
}

/** La tira de fotos, casi a color: es la bodega real, no una textura. */
function FotosVitrina() {
  const { posicion, total, sinMovimiento, anima } = useVitrina();

  // La tira lleva las seis tomas más el clon de la primera al final.
  const tomas = [...Array.from({ length: total }, (_, i) => i + 1), 1];

  return (
    <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
      <div
        className="flex h-full w-full"
        // En `style` y no en clases: el bloque global de prefers-reduced-motion
        // en globals.css aplasta cualquier duración declarada en CSS y se
        // llevaba también el deslizamiento que aquí sí queremos gobernar.
        style={{
          transform: `translateX(-${posicion * 100}%)`,
          transition:
            sinMovimiento || !anima
              ? "none"
              : `transform ${MS_DESLIZA}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        }}
      >
        {tomas.map((n, i) => (
          <div key={`${n}-${i}`} className="h-full w-full shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/vitrina/slide${n}.jpg`}
              alt=""
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "low"}
              decoding="async"
              // Casi a color y sin viraje de matiz: el color de estas fotos es
              // parte de lo que prueban (la reja de la bodega es naranja).
              className="h-full w-full object-cover [filter:saturate(1.06)_contrast(1.06)_brightness(0.86)]"
            />
          </div>
        ))}
      </div>

      <span className="velo-vitrina absolute inset-0" />
      <span className="filo-oro absolute inset-x-0 bottom-0 h-px opacity-70" />
    </div>
  );
}

/** Indicadores del carrusel. Se colocan donde los ponga quien los use — en el
 *  hero, sobre foto libre — nunca al pie del bloque, que es de las credenciales. */
export function IndicadoresVitrina({ className }: { className?: string }) {
  const { activa, total, elegir } = useVitrina();

  return (
    <div
      role="tablist"
      aria-label="Tomas de la bodega"
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-plano-hondo/55 px-2.5 py-1.5 backdrop-blur-[2px]",
        className
      )}
    >
      {Array.from({ length: total }, (_, i) => {
        const esta = activa === i;
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={esta}
            aria-label={`Ver toma ${i + 1} de ${total}`}
            onClick={() => elegir(i)}
            // Área táctil real de 44px con el punto centrado: se ve fino sin
            // volverse imposible de atinar con el pulgar.
            className="relative grid size-6 place-items-center before:absolute before:-inset-2.5 before:content-['']"
          >
            <span
              className={clsx(
                "block rounded-full transition-all duration-200",
                esta ? "h-1.5 w-5 bg-ambar" : "size-1.5 bg-white/45 hover:bg-white/75"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
