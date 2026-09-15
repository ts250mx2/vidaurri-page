"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { CLASE_BOTON_AMBAR_KIOSCO } from "@/components/kiosco/estilos";
import { pesos } from "@/lib/formato";
import { llamarKiosco } from "@/lib/kiosco/navegador";
import { RUTA_KIOSCO } from "@/lib/kiosco/rutas";

// El acuse: folio enorme y una sola instrucción, "pásalo al mostrador". Es lo
// último que el cliente ve, así que no compite con nada más en la pantalla.
//
// La cuenta regresiva no es urgencia inventada (eso está prohibido en esta
// casa): es higiene del aparato. Al llegar a cero se limpia el borrador y se
// recarga el inicio, para que el siguiente cliente no encuentre ni el folio ni
// el nombre del anterior. Quien ya terminó puede irse antes con el botón.

const SEGUNDOS = 60;

export function Acuse({ folio, piezas, total }: { folio: string; piezas: number; total: number }) {
  const [restan, setRestan] = useState(SEGUNDOS);
  const saliendo = useRef(false);

  useEffect(() => {
    async function reiniciar() {
      if (saliendo.current) return;
      saliendo.current = true;
      // El pedido ya está enviado: este borrado es por si Vico dejó algo
      // suelto. Si falla, se vuelve al inicio igual.
      const respuesta = await llamarKiosco("/borrador", { metodo: "DELETE" });
      if (respuesta.status !== 200) {
        console.error("[kiosco] no se pudo limpiar el borrador tras el acuse", respuesta.status);
      }
      window.location.assign(RUTA_KIOSCO);
    }

    const reloj = setInterval(() => {
      setRestan((actual) => {
        if (actual > 1) return actual - 1;
        void reiniciar();
        return 0;
      });
    }, 1000);
    return () => clearInterval(reloj);
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl py-4 text-center">
      <span className="inline-flex size-16 items-center justify-center rounded-full bg-existencia text-white">
        <Check aria-hidden className="size-9" />
      </span>
      <h1 className="titulo-lamina mt-4 text-4xl">Tu pedido ya está con el mostrador</h1>
      <p className="mt-3 text-xl leading-relaxed text-tinta-suave">
        Pásalo al mostrador con este folio y te lo surten.
      </p>

      <div className="lamina mt-6 overflow-hidden">
        <div className="bg-plano-hondo px-6 py-8 text-white">
          <p className="rotulo-tecnico text-sm text-white/60">Tu folio</p>
          <p className="num-tab mt-2 font-mono text-6xl font-bold tracking-tight">{folio}</p>
        </div>
        <dl className="num-tab grid grid-cols-2 divide-x divide-linea font-mono">
          <div className="px-6 py-4">
            <dt className="rotulo-tecnico text-xs text-tinta-suave">Piezas</dt>
            <dd className="mt-1 text-2xl font-semibold text-tinta">{piezas}</dd>
          </div>
          <div className="px-6 py-4">
            <dt className="rotulo-tecnico text-xs text-tinta-suave">Total</dt>
            <dd className="titulo-lamina mt-1 text-2xl text-tinta">{pesos(total)}</dd>
            <dd className="mt-0.5 font-sans text-xs text-tinta-suave">IVA incluido</dd>
          </div>
        </dl>
      </div>

      <p className="mt-5 text-base leading-relaxed text-tinta-suave">
        En el mostrador confirmamos la existencia de cada pieza y te cobramos ahí mismo. Si tenemos
        que pedir alguna, te decimos cuánto tarda.
      </p>

      <button
        type="button"
        onClick={() => window.location.assign(RUTA_KIOSCO)}
        className={`${CLASE_BOTON_AMBAR_KIOSCO} mt-6 w-full max-w-sm`}
      >
        Listo, gracias
      </button>
      <p aria-live="polite" className="mt-3 text-sm text-tinta-suave">
        Esta pantalla se limpia sola en{" "}
        <span className="num-tab font-mono font-semibold text-tinta">{restan}</span> s.
      </p>
    </div>
  );
}
