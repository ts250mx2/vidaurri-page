"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CLASE_BOTON_AMBAR_KIOSCO } from "./estilos";
import { cerrarTurno } from "@/lib/kiosco/navegador";
import {
  RUTA_KIOSCO,
  RUTA_KIOSCO_ENTRAR,
  RUTA_KIOSCO_MIS_PEDIDOS,
  RUTA_KIOSCO_PEDIDO,
} from "@/lib/kiosco/rutas";

// El cliente se va sin avisar: es lo normal en un mostrador. A los 90 segundos
// sin teclado ni ratón el kiosco pregunta "¿Sigues ahí?" y da 15 más; si nadie
// contesta, cierra el turno —el borrador y la sesión del cliente que entró con
// su celular— y vuelve al inicio, para que el siguiente cliente no herede el
// pedido del anterior, ni vea su nombre, ni sus pedidos.
//
// Vigila las pantallas del CLIENTE: armar, tus datos, entrar y mis pedidos
// (esta última es la más delicada: son sus pedidos a la vista de quien pase).
// El acuse tiene su propia cuenta, y activar/salir son del personal:
// borrarles lo que teclean sería una grosería.

const MS_INACTIVO = 90_000;
const SEGUNDOS_AVISO = 15;
/** Los eventos que cuentan como "sigue aquí"; el aviso se cancela con cualquiera. */
const EVENTOS = ["keydown", "pointerdown", "mousemove", "wheel", "touchstart"] as const;

const RUTAS_VIGILADAS: ReadonlyArray<string> = [
  RUTA_KIOSCO,
  RUTA_KIOSCO_PEDIDO,
  RUTA_KIOSCO_ENTRAR,
  RUTA_KIOSCO_MIS_PEDIDOS,
];

export function Inactividad() {
  const pathname = usePathname();
  // El vigilante se monta y se desmonta con la ruta, y va con `key`: así su
  // cuenta nace limpia en cada pantalla sin tener que reiniciarla a mano
  // (reiniciar estado desde un efecto es justo lo que React pide no hacer).
  if (!RUTAS_VIGILADAS.includes(pathname)) return null;
  return <Vigilante key={pathname} />;
}

function Vigilante() {
  /** null = sin aviso; un número = segundos que faltan para limpiar. */
  const [restan, setRestan] = useState<number | null>(null);
  const ultimaSenal = useRef(0);
  const saliendo = useRef(false);

  /** Cierra el turno (borrador y sesión del cliente) y recarga el inicio: la pantalla queda como nueva. */
  const reiniciar = useCallback(async () => {
    if (saliendo.current) return;
    saliendo.current = true;
    // Si la limpieza falla, igual se vuelve al inicio: dejar al cliente
    // siguiente frente al aviso congelado sería peor que un borrador viejo,
    // que de todos modos se limpia al enviar o a la siguiente inactividad.
    await cerrarTurno("inactividad");
    window.location.assign(RUTA_KIOSCO);
  }, []);

  useEffect(() => {
    ultimaSenal.current = Date.now();

    // React descarta el re-render cuando el estado no cambia (null === null),
    // así que llamarlo en cada mousemove no cuesta nada.
    function haySenal() {
      ultimaSenal.current = Date.now();
      setRestan(null);
    }
    for (const evento of EVENTOS) window.addEventListener(evento, haySenal, { passive: true });

    const reloj = setInterval(() => {
      setRestan((actual) => {
        if (actual === null) {
          return Date.now() - ultimaSenal.current >= MS_INACTIVO ? SEGUNDOS_AVISO : null;
        }
        if (actual > 1) return actual - 1;
        void reiniciar();
        return 0;
      });
    }, 1000);

    return () => {
      clearInterval(reloj);
      for (const evento of EVENTOS) window.removeEventListener(evento, haySenal);
    };
  }, [reiniciar]);

  if (restan === null) return null;

  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      aria-label="¿Sigues ahí?"
      className="fixed inset-0 z-50 grid place-items-center bg-plano-hondo/80 px-6 backdrop-blur-sm"
    >
      <div className="lamina w-full max-w-lg p-8 text-center">
        <h2 className="titulo-lamina text-4xl">¿Sigues ahí?</h2>
        <p className="mt-3 text-lg leading-relaxed text-tinta-suave">
          Si no, borro tu pedido, cierro tu sesión y dejo la pantalla lista para el siguiente
          cliente en{" "}
          <span className="num-tab font-mono font-bold text-tinta">{restan}</span> s.
        </p>
        <button
          type="button"
          onClick={() => {
            ultimaSenal.current = Date.now();
            setRestan(null);
          }}
          className={`${CLASE_BOTON_AMBAR_KIOSCO} mt-6 w-full`}
        >
          Sí, aquí sigo
        </button>
        <p className="mt-3 text-sm text-tinta-suave">Toca una tecla o mueve el ratón para seguir.</p>
      </div>
    </div>
  );
}
