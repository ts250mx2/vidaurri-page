"use client";

import { useState } from "react";
import { ArrowRight, Trash2, X } from "lucide-react";
import { FotoAmpliable, VisorPieza } from "@/components/VisorPieza";
import { Stepper } from "@/components/mostrador/Stepper";
import { useArea } from "@/components/kiosco/AreaContext";
import {
  CLASE_BOTON_AMBAR_KIOSCO,
  CLASE_ERROR_KIOSCO,
  CLASE_ETIQUETA_KIOSCO,
} from "@/components/kiosco/estilos";
import { pesos } from "@/lib/formato";
import { urlFotoNueva, urlFotoUsada } from "@/lib/fotos";
import { nombreSucursal } from "@/lib/kiosco/identidad";
import type { PartidaKiosco, PedidoKiosco as Pedido } from "@/lib/kiosco/tipos";
import type { SucursalEntrega } from "@/lib/mostrador/tipos";

// "Tu pedido": lo que el cliente lleva, el total con IVA y la única acción
// ámbar de la pantalla —Continuar, que lleva al paso 2. En pantalla grande es
// la columna de la derecha, siempre a la vista; en el celular es la hoja que
// se abre al tocar la barra de abajo (por eso `onCerrar`). Las cantidades se
// cambian con el mismo stepper del mostrador (botones de 44 px, y el campo se
// puede teclear); las usadas no llevan stepper porque son una unidad física.
//
// Nada de esto se calcula aquí: cada ± y cada quitar le pide a IA que rehaga el
// borrador y la tarjeta pinta lo que responde, así que el total que ve el
// cliente y el que ve el mostrador son siempre el mismo número.

const CONFIRMAR_VACIAR = "¿Vaciar tu pedido y empezar de nuevo?";
/** Renglones que nacen a la vista: su foto va con descarga inmediata (ver `RenglonPieza`). */
const A_LA_VISTA = 6;

export interface PropsPedidoKiosco {
  pedido: Pedido | null;
  ocupado: boolean;
  /** Sucursal ya fijada (la del aparato del kiosco); null = la elige el cliente al enviar. */
  sucursal: SucursalEntrega | null;
  /** Con cliente del padrón, el pedido ya va a su nombre y no se le piden datos. */
  nombreCliente: string | null;
  onCantidad: (idPartida: number, cantidad: number) => Promise<string | null>;
  onQuitar: (idPartida: number) => Promise<string | null>;
  onVaciar: () => Promise<string | null>;
  onContinuar: () => void;
  /** Si viene, la tarjeta es una hoja (móvil) y pinta el botón de cerrarla. */
  onCerrar?: () => void;
}

/** Código de bdav o, en usadas, el ID de la pieza en la Bodega. */
function referenciaDe(partida: PartidaKiosco): string {
  if (partida.codigo) return partida.codigo;
  return partida.idPiezaUsada !== null ? `Usada #${partida.idPiezaUsada}` : "";
}

/** La foto del renglón según de dónde salió la pieza; null si IA no la mandó (la casilla dice "foto por tomar"). */
function urlFotoPartida(partida: PartidaKiosco): string | null {
  if (!partida.foto) return null;
  return partida.origen === "usada" ? urlFotoUsada(partida.foto) : urlFotoNueva(partida.foto);
}

/** Dónde se recoge, o que eso se elige al final. */
function textoRecoger(sucursal: SucursalEntrega | null): string {
  return sucursal ? `lo recoges en ${nombreSucursal(sucursal)}` : "la sucursal la eliges al enviar";
}

export function PedidoKiosco({
  pedido,
  ocupado,
  sucursal,
  nombreCliente,
  onCantidad,
  onQuitar,
  onVaciar,
  onContinuar,
  onCerrar,
}: PropsPedidoKiosco) {
  const area = useArea();
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState(false);
  /** El renglón abierto en grande (`VisorPieza`); null = cerrado. */
  const [ampliada, setAmpliada] = useState<PartidaKiosco | null>(null);

  const partidas = pedido?.partidas ?? [];
  const hayPiezas = partidas.length > 0;
  const bloqueado = ocupado || trabajando;

  async function correr(accion: () => Promise<string | null>) {
    if (trabajando) return;
    setTrabajando(true);
    setError(null);
    const fallo = await accion();
    setTrabajando(false);
    if (fallo) setError(fallo);
  }

  function vaciar() {
    if (!window.confirm(CONFIRMAR_VACIAR)) return;
    void correr(onVaciar);
  }

  const notaContinuar = nombreCliente
    ? area.area === "cliente"
      ? "Ya va a tu nombre y con tu precio de cliente. Después eliges dónde lo recoges; el mostrador lo confirma antes de cobrarte nada."
      : "Ya va a tu nombre y con tu precio de cliente: solo lo revisas y lo envías. El mostrador lo confirma antes de cobrarte nada."
    : "Después te pedimos tu nombre y tu celular. El mostrador confirma tu pedido antes de cobrarte nada.";

  return (
    <div className="lamina flex h-full flex-col overflow-hidden">
      {ampliada && (
        <VisorPieza
          pieza={{
            foto: urlFotoPartida(ampliada),
            codigo: referenciaDe(ampliada),
            descripcion: ampliada.descripcion,
            precioConIva: ampliada.precioConIva,
            existencia: ampliada.origen === "usada" ? "Pieza única" : ampliada.hayEnTienda ? "En existencia" : "Sobre pedido",
          }}
          onCerrar={() => setAmpliada(null)}
        />
      )}
      <div className="flex items-start gap-3 border-b border-linea px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="min-w-0 flex-1">
          <p className={CLASE_ETIQUETA_KIOSCO}>Tu pedido</p>
          <p className="mt-1 text-sm text-tinta-suave">
            {nombreCliente ? (
              <>
                A nombre de <span className="font-semibold text-tinta">{nombreCliente}</span> ·{" "}
                {textoRecoger(sucursal)}
              </>
            ) : (
              <>{sucursal ? `Lo recoges en ${nombreSucursal(sucursal)}` : "La sucursal la eliges al enviar"}</>
            )}
          </p>
        </div>
        {onCerrar && (
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar tu pedido y seguir buscando"
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-tinta-suave transition-colors duration-150 hover:bg-papel hover:text-tinta"
          >
            <X aria-hidden className="size-6" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-5">
        {hayPiezas ? (
          <ul className="flex flex-col divide-y divide-linea">
            {partidas.map((partida, i) => {
              const referencia = referenciaDe(partida);
              const esUsada = partida.origen === "usada";
              return (
                <li key={partida.idPartida} className="flex flex-col gap-2 py-3.5">
                  <div className="flex items-start gap-2.5">
                    <FotoAmpliable
                      src={urlFotoPartida(partida)}
                      alt={partida.descripcion}
                      className="mesa-dibujo size-16 rounded-md border border-linea"
                      imgClassName="p-0.5"
                      prioritaria={i < A_LA_VISTA}
                      onAmpliar={() => setAmpliada(partida)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold leading-snug text-tinta">
                        {partida.descripcion}
                      </p>
                      <p className="num-tab mt-1 font-mono text-xs text-tinta-suave">
                        {referencia}
                        {referencia && " · "}
                        {pesos(partida.precioConIva)} c/u
                      </p>
                    </div>
                    <p className="num-tab shrink-0 font-mono text-base font-semibold text-tinta">
                      {pesos(partida.importe)}
                    </p>
                    <button
                      type="button"
                      onClick={() => void correr(() => onQuitar(partida.idPartida))}
                      disabled={bloqueado}
                      aria-label={`Quitar ${partida.descripcion} de tu pedido`}
                      title="Quitar de tu pedido"
                      className="flex size-10 shrink-0 items-center justify-center rounded-md text-tinta-suave transition-colors duration-150 hover:bg-papel hover:text-anotacion disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <Trash2 aria-hidden className="size-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {esUsada ? (
                      <span className="sello sello-unica">Pieza única</span>
                    ) : (
                      <Stepper
                        etiqueta={`Cantidad de ${referencia || partida.descripcion}`}
                        cantidad={partida.cantidad}
                        bloqueado={bloqueado}
                        onCambiar={(cantidad) => void correr(() => onCantidad(partida.idPartida, cantidad))}
                      />
                    )}
                    {/* Lo que no alcanza en tienda se dice aquí, no al final:
                        el cliente tiene que enterarse antes de dar sus datos. */}
                    {!partida.hayEnTienda && <span className="sello text-plano">Sobre pedido</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-10 text-center">
            <p className="titulo-lamina text-xl text-tinta">Tu pedido está vacío</p>
            <p className="mt-2 text-sm leading-relaxed text-tinta-suave">
              Busca tu pieza o pregúntale a Vico y toca{" "}
              <span className="font-semibold text-tinta">Agregar</span>. Puedes poner todas las que
              necesites.
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-linea bg-hoja px-4 py-4 sm:px-5">
        {error && (
          <p role="alert" className={`${CLASE_ERROR_KIOSCO} mb-3`}>
            {error}
          </p>
        )}

        <dl className="num-tab grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1 font-mono text-sm">
          <dt className="text-tinta-suave">Piezas</dt>
          <dd className="text-right text-tinta">{pedido?.piezas ?? 0}</dd>
          <dt className="rotulo-tecnico self-center text-sm text-tinta">Total</dt>
          <dd className="titulo-lamina text-right text-3xl text-tinta">{pesos(pedido?.total ?? 0)}</dd>
        </dl>
        <p className="mt-1 text-right text-xs text-tinta-suave">IVA incluido</p>

        <button
          type="button"
          onClick={onContinuar}
          disabled={bloqueado || !hayPiezas}
          className={`${CLASE_BOTON_AMBAR_KIOSCO} mt-4 w-full`}
        >
          Continuar
          <ArrowRight aria-hidden className="size-5" />
        </button>
        <p className="mt-2 text-center text-xs leading-relaxed text-tinta-suave">{notaContinuar}</p>

        {hayPiezas && (
          <button
            type="button"
            onClick={vaciar}
            disabled={bloqueado}
            className="mt-3 w-full text-center text-xs font-semibold text-tinta-suave underline underline-offset-2 transition-colors duration-150 hover:text-anotacion disabled:opacity-50"
          >
            Vaciar mi pedido
          </button>
        )}
      </div>
    </div>
  );
}
