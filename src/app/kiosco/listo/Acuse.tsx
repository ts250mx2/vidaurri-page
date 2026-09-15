"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, PackagePlus, ReceiptText } from "lucide-react";
import { useArea } from "@/components/kiosco/AreaContext";
import { CLASE_BOTON_AMBAR_KIOSCO, CLASE_BOTON_NEUTRO_KIOSCO } from "@/components/kiosco/estilos";
import { pesos } from "@/lib/formato";
import { nombreSucursal } from "@/lib/kiosco/identidad";
import { cerrarTurno } from "@/lib/kiosco/navegador";
import type { SucursalEntrega } from "@/lib/mostrador/tipos";

// El acuse: folio enorme y una sola instrucción. Es lo último que el cliente
// ve, así que no compite con nada más en la pantalla. Cambia por área:
//
// - Kiosco: "pásalo al mostrador" y una cuenta regresiva que no es urgencia
//   inventada (eso está prohibido en esta casa) sino higiene del aparato: al
//   llegar a cero —o antes, con "Listo, gracias"— se cierra el turno (la
//   sesión del cliente y el borrador) y se recarga el inicio, para que el
//   siguiente cliente no encuentre ni el folio ni el nombre del anterior.
// - Clientes: es su dispositivo. "Te avisamos por WhatsApp cuando esté
//   listo", dónde lo recoge, y las salidas: ver sus pedidos o armar otro.

const SEGUNDOS = 60;

/** Cierra el turno una sola vez y recarga el inicio; vale para el reloj y para el botón. */
async function reiniciar(saliendo: { current: boolean }, destino: string): Promise<void> {
  if (saliendo.current) return;
  saliendo.current = true;
  // El pedido ya está enviado: esto es por si Vico dejó algo suelto y, sobre
  // todo, para que la sesión del cliente no sobreviva al acuse.
  await cerrarTurno("acuse");
  window.location.assign(destino);
}

function CuentaRegresivaKiosco({ destino }: { destino: string }) {
  const [restan, setRestan] = useState(SEGUNDOS);
  const saliendo = useRef(false);

  useEffect(() => {
    const reloj = setInterval(() => {
      setRestan((actual) => {
        if (actual > 1) return actual - 1;
        void reiniciar(saliendo, destino);
        return 0;
      });
    }, 1000);
    return () => clearInterval(reloj);
  }, [destino]);

  return (
    <>
      <button
        type="button"
        onClick={() => void reiniciar(saliendo, destino)}
        className={`${CLASE_BOTON_AMBAR_KIOSCO} mt-6 w-full max-w-sm`}
      >
        Listo, gracias
      </button>
      <p aria-live="polite" className="mt-3 text-sm text-tinta-suave">
        Esta pantalla se limpia sola en{" "}
        <span className="num-tab font-mono font-semibold text-tinta">{restan}</span> s.
      </p>
    </>
  );
}

export function Acuse({
  folio,
  piezas,
  total,
  sucursal = null,
}: {
  folio: string;
  piezas: number;
  total: number;
  /** Donde se recoge; en el kiosco es la del aparato y no se repite aquí. */
  sucursal?: SucursalEntrega | null;
}) {
  const area = useArea();
  const esKiosco = area.area === "kiosco";

  return (
    <div className="mx-auto w-full max-w-3xl py-2 text-center sm:py-4">
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-existencia text-white sm:size-16">
        <Check aria-hidden className="size-8 sm:size-9" />
      </span>
      <h1 className="titulo-lamina mt-4 text-3xl sm:text-4xl">Tu pedido ya está con el mostrador</h1>
      <p className="mt-3 text-lg leading-relaxed text-tinta-suave sm:text-xl">
        {esKiosco
          ? "Pásalo al mostrador con este folio y te lo surten."
          : "Te avisamos por WhatsApp cuando esté listo."}
      </p>

      <div className="lamina mt-6 overflow-hidden">
        <div className="bg-plano-hondo px-4 py-7 text-white sm:px-6 sm:py-8">
          <p className="rotulo-tecnico text-sm text-white/60">Tu folio</p>
          <p className="num-tab mt-2 break-all font-mono text-5xl font-bold tracking-tight sm:text-6xl">{folio}</p>
        </div>
        <dl className="num-tab grid grid-cols-2 divide-x divide-linea font-mono">
          <div className="px-4 py-4 sm:px-6">
            <dt className="rotulo-tecnico text-xs text-tinta-suave">Piezas</dt>
            <dd className="mt-1 text-2xl font-semibold text-tinta">{piezas}</dd>
          </div>
          <div className="px-4 py-4 sm:px-6">
            <dt className="rotulo-tecnico text-xs text-tinta-suave">Total</dt>
            <dd className="titulo-lamina mt-1 text-2xl text-tinta">{pesos(total)}</dd>
            <dd className="mt-0.5 font-sans text-xs text-tinta-suave">IVA incluido</dd>
          </div>
        </dl>
      </div>

      <p className="mt-5 text-base leading-relaxed text-tinta-suave">
        {esKiosco ? (
          <>
            En el mostrador confirmamos la existencia de cada pieza y te cobramos ahí mismo. Si tenemos
            que pedir alguna, te decimos cuánto tarda.
          </>
        ) : (
          <>
            {sucursal && (
              <>
                Lo recoges en <span className="font-semibold text-tinta">{nombreSucursal(sucursal)}</span>.{" "}
              </>
            )}
            El mostrador confirma la existencia de cada pieza y te cobra al recoger. Si tenemos que
            pedir alguna, te decimos cuánto tarda.
          </>
        )}
      </p>

      {esKiosco ? (
        <CuentaRegresivaKiosco destino={area.rutas.armar} />
      ) : (
        <div className="mx-auto mt-6 flex w-full max-w-sm flex-col gap-3">
          <Link href={area.rutas.misPedidos} prefetch={false} className={`${CLASE_BOTON_AMBAR_KIOSCO} w-full`}>
            <ReceiptText aria-hidden className="size-5" />
            Ver mis pedidos
          </Link>
          <Link href={area.rutas.armar} prefetch={false} className={`${CLASE_BOTON_NEUTRO_KIOSCO} w-full`}>
            <PackagePlus aria-hidden className="size-5" />
            Armar otro pedido
          </Link>
        </div>
      )}
    </div>
  );
}
